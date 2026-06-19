import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, Tv, List, Heart, Settings, Sun, Moon, Search, LogOut, Play, Plus, X } from 'lucide-react';
import { MediaRow } from './MediaRow';
import { VideoPlayerModal } from './VideoPlayerModal';

interface Movie {
  id: string;
  title: string;
  description: string;
  banner: string;
}

interface DashboardProps {
  onLogout: () => void;
  playVideo: (id: string) => void;
  featuredMovies: Movie[];
  errorMessage: string;
  setErrorMessage: (message: string) => void;
}

const HERO_MOVIES = [
  { id: 'vid-999', title: 'Stranger Things Season 5', desc: 'The final seasonal breakdown arrives. Hawkins stands fractured as the dark entity vectors of the Upside Down bleed directly into the core reality matrices.', bg: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop' },
  { id: 'h1', title: 'FlixFlow Original: Echoes', desc: 'In a world rewritten by code, one developer unlocks the ultimate system legacy.', bg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80' },
  { id: 'h2', title: 'The Quantum Shift', desc: 'Time is no longer linear. Stream the sci-fi thriller of the year tonight.', bg: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80' }
];

export const Dashboard: React.FC<DashboardProps> = ({
  onLogout,
}) => {
  // Navigation & Modal States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState({ id: 'p1', name: 'Primary Account', avatar: 'bg-red-600' });
  
  // App Settings States
  const [autoplay, setAutoplay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [preferredResolution, setPreferredResolution] = useState('1080p');

  // Hero indices
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Streaming Player Trackers
  const [activePlayer, setActivePlayer] = useState({
    isOpen: false,
    manifestUrl: '',
    title: ''
  });

  // 1. Auto-sliding Hero Mechanism
  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_MOVIES.length);
    }, 6000); // Transitions automatically every 6 seconds
    return () => clearInterval(timer);
  }, [autoplay]);

  // Handle global body class for dark mode compatibility
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Asynchronous Database Catalog Synchronizer Hook
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/v1/catalog/videos');
        const normalized = response.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400',
          banner: item.thumbnail_url || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop',
          manifest_url: item.manifest_url,
          matchScore: item.matchScore || Math.floor(Math.random() * 15) + 85,
          rating: item.rating || '13+',
          year: item.year || '2026'
        }));
        setMovies(normalized);
      } catch (error) {
        console.error("Gateway lookup failure falling back to sample matrices: ", error);
        setMovies([
          {
            id: 'vid-999',
            title: 'Stranger Things Season 5',
            description: 'The final season has arrived. The portal is open, and Hawkins will never be the same.',
            thumbnail: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=400',
            banner: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop',
            matchScore: 99,
            rating: '13+',
            year: '2026',
            manifest_url: 'https://d111111abcdef8.cloudfront.net/vid-999/hls/vid-999_1080p.m3u8'
          },
          {
            id: 'm1',
            title: 'Cyberpunk Redux',
            description: 'A futuristic cyberworld where netrunners rule the neon streets.',
            thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400',
            banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200',
            matchScore: 98,
            rating: '18+',
            year: '2026',
            manifest_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
          },
          {
            id: 'm2',
            title: 'The Void Matrix',
            description: 'Enter the empty simulation where absolute cold vectors collide.',
            thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400',
            banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200',
            matchScore: 94,
            rating: '16+',
            year: '2025',
            manifest_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
          },
          {
            id: 'm3',
            title: 'Hawkins Echoes',
            description: 'Hawkins stands fractured as the dark entity vectors bleed into reality.',
            thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400',
            banner: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200',
            matchScore: 99,
            rating: '13+',
            year: '2026',
            manifest_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
          },
          {
            id: 'm4',
            title: 'Aurora Zero',
            description: 'Aurora fields glow as absolute vectors drop to zero.',
            thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400',
            banner: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1200',
            matchScore: 89,
            rating: 'PG',
            year: '2024',
            manifest_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleLaunchStream = (selectedMovieId: string) => {
    const targetMovie = movies.find((m) => m.id === selectedMovieId);
    if (targetMovie) {
      setActivePlayer({
        isOpen: true,
        manifestUrl: targetMovie.manifest_url,
        title: targetMovie.title
      });
    } else {
      const targetFeatured = HERO_MOVIES.find((m) => m.id === selectedMovieId);
      if (targetFeatured) {
        setActivePlayer({
          isOpen: true,
          manifestUrl: 'https://d111111abcdef8.cloudfront.net/vid-999/hls/vid-999_1080p.m3u8',
          title: targetFeatured.title
        });
      }
    }
  };

  // Filter movies dynamically based on search query
  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`flex h-screen max-h-screen font-sans transition-colors duration-500 overflow-hidden relative ${
        isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* =========================================================================
          THE THREE-COLOR GRADIENT MESH LAYER (Fused Backdrop)
          ========================================================================= */}
      {isDarkMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40 mix-blend-screen transition-opacity duration-500">
          {/* 1. Neon Crimson Glow (Top Left focus) */}
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-red-600 rounded-full blur-[150px] animate-pulse duration-[8s]" />

          {/* 2. Cyber Blue Glow (Center Right focus) */}
          <div className="absolute top-[20%] right-[-10%] w-[700px] h-[700px] bg-cyan-500 rounded-full blur-[180px] opacity-80" />

          {/* 3. Golden Amber Glow (Bottom Center focus) */}
          <div className="absolute bottom-[-10%] left-[30%] w-[650px] h-[650px] bg-amber-500 rounded-full blur-[160px] opacity-60 animate-pulse duration-[12s]" />
        </div>
      )}

      {/* =========================================================================
          1. ANIMATED MICRO-DOCK SIDEBAR (Glassmorphic Finish)
          ========================================================================= */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out backdrop-blur-xl ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } ${isDarkMode ? 'bg-black/40 border-r border-white/5' : 'bg-white/80 border-r border-gray-200'}`}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        {/* Brand Logo Area */}
        <div className="h-20 flex items-center px-6 overflow-hidden flex-shrink-0">
          <span
            className={`text-2xl font-black tracking-wider transition-opacity duration-200 bg-gradient-to-r from-red-500 via-cyan-400 to-amber-400 bg-clip-text text-transparent ${
              !isSidebarOpen && 'opacity-0 w-0'
            }`}
          >
            FLIXFLOW
          </span>
          {!isSidebarOpen && (
            <span className="text-2xl font-black bg-gradient-to-br from-red-500 to-cyan-400 bg-clip-text text-transparent">
              FF
            </span>
          )}
        </div>

        {/* Navigation Item Matrix */}
        <nav className="flex-1 flex flex-col gap-2 px-3 mt-4">
          {[
            { icon: <Home size={22} />, label: 'Home', active: true },
            { icon: <Tv size={22} />, label: 'Series' },
            { icon: <List size={22} />, label: 'My List' },
            { icon: <Heart size={22} />, label: 'Favorites' },
            { 
              icon: <Settings size={22} />, 
              label: 'Settings', 
              onClick: () => setIsSettingsOpen(true) 
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`flex items-center gap-4 w-full p-3.5 rounded-xl text-left transition-all group relative overflow-hidden ${
                item.active
                  ? 'text-white bg-gradient-to-r from-red-600/20 via-cyan-500/10 to-amber-500/5 border border-white/10 shadow-lg shadow-red-900/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div
                className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  item.active && 'text-red-500'
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                  isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer - Sign Out */}
        <div className="mt-auto px-3 mb-6 flex-shrink-0">
          <button
            onClick={onLogout}
            className="flex items-center gap-4 w-full p-3.5 rounded-xl text-left transition-all group relative overflow-hidden text-red-500 hover:bg-red-500/10"
          >
            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              <LogOut size={22} />
            </div>
            <span
              className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT STREAM
          ========================================================================= */}
      <main className="flex-1 pl-20 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 z-10 relative">
        {/* Top Floating Control Header */}
        <header className="h-20 px-8 flex items-center justify-between gap-4">
          {/* Search Input Bar */}
          <div className="relative max-w-md w-full min-w-[150px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, genres, actors..."
              className={`w-full pl-12 pr-4 py-2.5 rounded-full text-sm outline-none transition-all ${
                isDarkMode
                  ? 'bg-white/5 text-white placeholder-zinc-500 focus:bg-white/10 border border-white/5 focus:border-cyan-500/30'
                  : 'bg-gray-200 text-gray-900 placeholder-gray-500 focus:bg-gray-300'
              }`}
            />
          </div>

          {/* Configuration Utilities */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Ambient Palette Badge Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-white/5 border border-white/5 text-gray-300 select-none flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Blended Fusion Mode
            </div>

            {/* Light/Dark Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/5 text-gray-400"
            >
              {isDarkMode ? (
                <Sun size={19} className="text-amber-400" />
              ) : (
                <Moon size={19} className="text-indigo-600" />
              )}
            </button>

            {/* Watch Profile Context Avatar & Action */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/5 text-gray-300 hover:text-white"
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>
              <div 
                onClick={() => setIsSettingsOpen(true)}
                className={`w-9 h-9 rounded-xl ${activeProfile.avatar} flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 transition cursor-pointer select-none text-white`}
              >
                {activeProfile.name[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Premium Combined Hero Banner Card (Auto-Sliding) */}
        <section className="relative px-8 py-6">
          <div
            className={`p-6 sm:p-12 rounded-3xl relative overflow-hidden min-h-[300px] sm:min-h-[400px] md:min-h-[460px] flex flex-col justify-end border transition-all duration-1000 ${
              isDarkMode
                ? 'bg-gradient-to-t from-black via-black/40 to-transparent border-white/5 shadow-2xl shadow-black'
                : 'bg-gray-300 border-gray-200'
            }`}
          >
            {/* Background Image overlay if available */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none transition-all duration-1000 ease-in-out">
              <img
                src={HERO_MOVIES[currentHeroIndex].bg}
                alt={HERO_MOVIES[currentHeroIndex].title}
                className="w-full h-full object-cover object-center opacity-40 transition-all duration-1000 ease-in-out"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t transition-colors duration-1000 ${
                  isDarkMode
                    ? 'from-black via-black/40 to-transparent'
                    : 'from-gray-50 via-gray-50/30 to-transparent'
                }`}
              />
            </div>

            {/* Subtle content separator overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-0 pointer-events-none" />

            <div className="relative z-10 max-w-2xl text-white">
              {/* Mixed multi-color pill badge */}
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 bg-gradient-to-r from-red-600 via-cyan-500 to-amber-500 text-white shadow-md">
                Featured Release
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-xl leading-tight">
                {HERO_MOVIES[currentHeroIndex].title.split(': ')[0]} <br />
                <span className="bg-gradient-to-r from-red-500 via-cyan-400 to-amber-300 bg-clip-text text-transparent">
                  {HERO_MOVIES[currentHeroIndex].title.split(': ')[1] || HERO_MOVIES[currentHeroIndex].title}
                </span>
              </h1>

              <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 max-w-lg drop-shadow-sm">
                {HERO_MOVIES[currentHeroIndex].desc}
              </p>

              {/* Interactive buttons with reactive focus colors */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLaunchStream(HERO_MOVIES[currentHeroIndex].id)}
                  className="px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 bg-white text-black hover:bg-neutral-200 shadow-lg hover:scale-105 active:scale-95"
                >
                  <Play size={16} fill="black" /> Watch Now
                </button>
                <button className="px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition flex items-center gap-2 hover:scale-105 active:scale-95">
                  <Plus size={16} /> Add List
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Video Showcase Underneath Hero */}
        <div className="mt-4 pb-12">
          {loading ? (
            <div className="px-8 text-zinc-500 font-medium animate-pulse">
              Synchronizing FlixFlow catalog matrix layers...
            </div>
          ) : (
            <>
              <MediaRow
                rowTitle="Trending Now on FlixFlow"
                movies={filteredMovies}
                onSelectVideo={handleLaunchStream}
              />
              <MediaRow
                rowTitle="Action & Thrillers Blend"
                movies={[...filteredMovies].reverse()}
                onSelectVideo={handleLaunchStream}
              />
            </>
          )}
        </div>
      </main>

      {/* =========================================================================
          THE INTEGRATED STREAMING ENGINE SURFACE
          ========================================================================= */}
      <VideoPlayerModal
        isOpen={activePlayer.isOpen}
        manifestUrl={activePlayer.manifestUrl}
        videoTitle={activePlayer.title}
        onClose={() => setActivePlayer((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* =========================================================================
          SETTINGS PANEL MODAL
          ========================================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#181818] w-full max-w-lg rounded-lg border border-white/10 shadow-2xl overflow-hidden text-sm text-white flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center flex-shrink-0">
              <h4 className="text-xl font-bold flex items-center space-x-2">
                <Settings className="w-5 h-5 text-red-600" />
                <span>FlixFlow System Settings</span>
              </h4>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 bg-white/5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-grow min-h-0 scrollbar-thin">
              {/* Profile Context Selector */}
              <div className="space-y-3">
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Active Watch Profile</label>
                <div className="flex space-x-3">
                  {[{ id: 'p1', name: 'Primary Account', avatar: 'bg-red-600' }, { id: 'p2', name: 'Kids Tiers', avatar: 'bg-blue-600' }].map((p) => (
                    <button 
                      key={p.id}
                      onClick={() => setActiveProfile(p)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded border transition-all ${activeProfile.id === p.id ? 'border-red-600 bg-red-600/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                    >
                      <div className={`w-4 h-4 rounded-full ${p.avatar}`} />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Bitrate Threshold Selectors */}
              <div className="space-y-3">
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Device Hardware Cap Limits</label>
                <select 
                  value={preferredResolution}
                  onChange={(e) => setPreferredResolution(e.target.value)}
                  className="w-full bg-[#2f2f2f] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 transition-colors hover:bg-[#3f3f3f]"
                >
                  <option value="1080p">1080p FHD (High End Screen Matrix)</option>
                  <option value="720p">720p HD (Data Saver / Mobile Scale)</option>
                  <option value="480p">480p SD (Legacy Hardware Display)</option>
                </select>
              </div>

              {/* Toggle Switches */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-200">Continuous Autoplay</p>
                    <p className="text-xs text-gray-400">Instantly trigger the next sequence block.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={autoplay} 
                    onChange={(e) => setAutoplay(e.target.checked)}
                    className="accent-red-600 w-4 h-4 cursor-pointer" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-200">Device Native Data Saver</p>
                    <p className="text-xs text-gray-400">Force lowest-latency pipeline profiles.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={dataSaver} 
                    onChange={(e) => setDataSaver(e.target.checked)}
                    className="accent-red-600 w-4 h-4 cursor-pointer" 
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-black/40 border-t border-white/10 text-right flex-shrink-0">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="bg-red-600 text-white font-bold px-5 py-2 rounded hover:bg-red-700 transition"
              >
                Save Configurations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
