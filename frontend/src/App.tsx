import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { VideoPlayer } from './components/VideoPlayer';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Video Player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeManifestUrl, setActiveManifestUrl] = useState<string>('');

  // Seed list of local mockup items in case DB has only one video
  const featuredMovies = [
    { id: 'vid-999', title: 'Stranger Things Season 5', description: 'The final season has arrived. The portal is open, and Hawkins will never be the same.', banner: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop' },
    { id: 'vid-100', title: 'Squid Game S2', description: 'Player 456 returns to finish what he started.', banner: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&auto=format&fit=crop' },
    { id: 'vid-200', title: 'Wednesday Season 2', description: 'Mayhem and mystery await at Nevermore Academy.', banner: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400&auto=format&fit=crop' },
    { id: 'vid-300', title: 'The Crown', description: 'A dramatized history of Queen Elizabeth II and the political events.', banner: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?q=80&w=400&auto=format&fit=crop' },
  ];

  // Auto-clear error messages
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/api/v1/auth/login', { email, password });
      const jwtToken = res.data.token;
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Login failed. Please check credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/v1/auth/register', { email, password });
      setIsRegisterMode(false);
      setErrorMessage('Account created successfully! Please log in.');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  const playVideo = async (videoId: string) => {
    try {
      // 1. Fetch metadata details from Catalog Service via API Gateway Proxy
      // Note: We use custom subscriber header mock 'X-User-ID' matching our seed configuration.
      const res = await axios.get(`http://localhost:8080/api/v1/catalog/video?id=${videoId}`, {
        headers: {
          'X-User-ID': 'user-123', // Active subscriber seed userID from migrations
        }
      });
      
      const videoData = res.data;
      
      // 2. Load manifest URL (e.g. vid-999_1080p.m3u8 or user-specified CDN link)
      setActiveManifestUrl(videoData.manifest_url);
      setIsPlaying(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Access denied: Subscription verification failed.');
    }
  };

  // If no auth token is active, show the Login Form Overlay
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur-xl">
          
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-red-600 font-sans select-none">FLIXFLOW</h1>
            <p className="text-zinc-400 text-xs mt-2 font-medium">OTT Streaming Platform Developer Portal</p>
          </div>

          {/* Form Tabs for Sign In / Create Account */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => { setIsRegisterMode(false); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                !isRegisterMode 
                  ? 'border-b-2 border-red-600 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegisterMode(true); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                isRegisterMode 
                  ? 'border-b-2 border-red-600 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors"
                placeholder="developer@flixflow.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-red-600/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-400 font-medium">
                {errorMessage}
              </div>
            )}

            <button 
              type="submit"
              className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors active:bg-red-800 shadow-lg shadow-red-600/10"
            >
              {isRegisterMode ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            {isRegisterMode ? (
              <span>Already have an account? <button onClick={() => setIsRegisterMode(false)} className="text-zinc-300 hover:text-white underline font-medium">Sign in now</button></span>
            ) : (
              <span>New to the platform? <button onClick={() => setIsRegisterMode(true)} className="text-zinc-300 hover:text-white underline font-medium">Create an account</button></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard
        onLogout={handleLogout}
        playVideo={playVideo}
        featuredMovies={featuredMovies}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />

      {/* Embedded streaming video player overlay */}
      {isPlaying && (
        <VideoPlayer 
          manifestUrl={activeManifestUrl} 
          onClose={() => {
            setIsPlaying(false);
            setActiveManifestUrl('');
          }} 
        />
      )}
    </>
  );
}
