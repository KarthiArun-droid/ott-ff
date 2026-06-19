import React, { useState, useEffect } from 'react';
import { Play, Plus, Heart, Download, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadEpisodeForOffline, isMovieCached, deleteCachedMovie } from '../utils/offlineDownloader';

interface MovieItem {
  id: string;
  title: string;
  thumbnail: string;
  matchScore: number;
  rating: string;
  year: string;
  manifest_url?: string;
}

interface MediaRowProps {
  rowTitle: string;
  movies: MovieItem[];
  onSelectVideo: (id: string) => void;
}

export const MediaRow: React.FC<MediaRowProps> = ({ rowTitle, movies, onSelectVideo }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const offset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: scrollLeft + offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative z-20 px-8 my-10 text-white group/row">
      {/* Row Title */}
      <h2 className="text-xl font-bold mb-4 tracking-wide text-zinc-200 hover:text-white transition cursor-pointer inline-block">
        {rowTitle}
      </h2>

      {/* Row Wrapper with arrows */}
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-[-32px] top-0 bottom-[24px] z-30 bg-black/60 w-10 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-black/90 text-white rounded-r-lg border-y border-r border-white/5"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Horizontal Scroll Layout */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto pb-6 pt-2 px-1 scrollbar-none overflow-y-visible scroll-smooth"
        >
          {movies.map((movie) => (
            <MediaCard key={movie.id} movie={movie} onSelectVideo={onSelectVideo} />
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-[-32px] top-0 bottom-[24px] z-30 bg-black/60 w-10 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-black/90 text-white rounded-l-lg border-y border-l border-white/5"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

// Internal Glassmorphic Hover Card
const MediaCard: React.FC<{ movie: MovieItem; onSelectVideo: (id: string) => void }> = ({ movie, onSelectVideo }) => {
  const [hovered, setHovered] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Monitor offline state of movie segments
  useEffect(() => {
    if (!movie.manifest_url) return;
    isMovieCached(movie.manifest_url).then(setIsCached);
  }, [movie.manifest_url]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movie.manifest_url) return;

    if (isCached) {
      // Toggle deletion if already downloaded
      const deleted = await deleteCachedMovie(movie.manifest_url);
      if (deleted) setIsCached(false);
      return;
    }

    try {
      setDownloadProgress(0);
      await downloadEpisodeForOffline(movie.manifest_url, (progress) => {
        setDownloadProgress(progress);
      });
      setIsCached(true);
    } catch (err) {
      alert("Offline cache failed. Please verify network settings.");
    } finally {
      setDownloadProgress(null);
    }
  };

  return (
    <div
      className="relative flex-none w-72 h-40 bg-white/5 rounded-2xl border border-white/5 transition-all duration-300 ease-out cursor-pointer hover:scale-105 hover:bg-zinc-900/90 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-black"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Standard Image Thumbnail Container */}
      <div className="w-full h-full rounded-2xl overflow-hidden relative" onClick={() => onSelectVideo(movie.id)}>
        <img
          src={movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {/* Subtle Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-4 font-bold text-sm drop-shadow-md truncate max-w-[85%]">
          {!hovered && movie.title}
        </span>
      </div>

      {/* Slide Down Extended Spec Panel (Triggers instantly on Hover) */}
      {hovered && (
        <div className="absolute top-[95%] left-0 right-0 bg-zinc-900/95 border-x border-b border-white/10 rounded-b-2xl p-4 shadow-2xl z-50 animate-fadeIn backdrop-blur-md">
          <h4 className="font-bold text-sm mb-2 text-white truncate">{movie.title}</h4>
          
          {/* Action Ring Toolbar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onSelectVideo(movie.id)}
                className="p-2 bg-gradient-to-r from-red-500 via-cyan-500 to-amber-500 rounded-xl text-white hover:opacity-90 transition shadow-md"
              >
                <Play size={14} fill="currentColor" />
              </button>
              <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-white transition">
                <Plus size={14} />
              </button>
              {movie.manifest_url && (
                <button
                  onClick={handleDownload}
                  className={`p-2 rounded-xl transition border border-white/10 flex items-center justify-center ${
                    isCached 
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30' 
                      : downloadProgress !== null 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 cursor-wait'
                      : 'bg-white/5 text-gray-300 hover:border-white'
                  }`}
                  disabled={downloadProgress !== null}
                >
                  {downloadProgress !== null ? (
                    <span className="text-[10px] font-bold tracking-tighter">{downloadProgress}%</span>
                  ) : isCached ? (
                    <Check size={14} className="stroke-[3]" />
                  ) : (
                    <Download size={14} />
                  )}
                </button>
              )}
            </div>
            <button className="p-2 text-gray-400 hover:text-red-500 transition">
              <Heart size={14} />
            </button>
          </div>

          {/* Core Spec Metadata Badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-bold">{movie.matchScore}% Match</span>
            <span className="text-gray-400">{movie.year}</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/10 rounded text-gray-300 font-medium">
              {movie.rating}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
