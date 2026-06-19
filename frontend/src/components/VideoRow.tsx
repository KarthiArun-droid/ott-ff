import React, { useState } from 'react';
import { Play, Plus } from 'lucide-react';

interface VideoAsset {
  id: string;
  title: string;
  thumbnailUrl: string;
  rating: string;
  matchScore: number;
  resolution: string;
}

interface VideoRowProps {
  title: string;
  videos: VideoAsset[];
  onPlayClick: (id: string) => void;
}

export const VideoRow: React.FC<VideoRowProps> = ({ title, videos, onPlayClick }) => {
  return (
    <div className="text-white my-8 px-8">
      {/* Row Title */}
      <h2 className="text-xl font-bold mb-4 text-gray-200 hover:text-white cursor-pointer transition-colors duration-200">
        {title}
      </h2>

      {/* Horizontal Scroll Wrapper */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-2 overflow-y-visible">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onPlayClick={onPlayClick} />
        ))}
      </div>
    </div>
  );
};

// Internal Prime Video Style Hover-Card Component
const VideoCard: React.FC<{ video: VideoAsset; onPlayClick: (id: string) => void }> = ({ video, onPlayClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex-none w-64 h-36 bg-zinc-900 rounded-md transition-all duration-300 ease-out z-10 hover:z-50 hover:scale-110 hover:shadow-2xl hover:shadow-black"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Standard Thumbnail State */}
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="w-full h-full object-cover rounded-md cursor-pointer"
      />

      {/* Prime-Style Dropdown Hover Metadata Block */}
      {isHovered && (
        <div className="absolute top-full left-0 right-0 bg-zinc-900 p-4 rounded-b-md shadow-2xl border-t border-zinc-800 transition-opacity duration-200 opacity-100">
          <h4 className="font-semibold text-sm mb-2 line-clamp-1">{video.title}</h4>
          
          {/* Action Row */}
          <div className="flex items-center gap-2 mb-3">
            <button 
              onClick={() => onPlayClick(video.id)}
              className="p-1.5 bg-white text-black rounded-full hover:bg-neutral-200 transition"
            >
              <Play size={16} fill="black" />
            </button>
            <button className="p-1.5 bg-zinc-800 border border-zinc-600 rounded-full hover:border-white transition">
              <Plus size={16} />
            </button>
          </div>

          {/* Quick Specifications Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="text-green-400 font-bold">{video.matchScore}% Match</span>
            <span className="px-1 border border-zinc-600 text-[10px] rounded bg-zinc-800 text-gray-300 font-medium">
              {video.rating}
            </span>
            <span className="px-1 border border-zinc-600 text-[10px] rounded bg-zinc-800 text-gray-300 font-medium">
              {video.resolution}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
