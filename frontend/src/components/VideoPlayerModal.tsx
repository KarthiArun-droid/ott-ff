import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  manifestUrl: string;
  videoTitle: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, manifestUrl, videoTitle, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    // Lock scrolling on the main page while watching a movie
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    const videoNode = videoRef.current;
    if (!isOpen || !videoNode || !manifestUrl) return;

    // Use native safari HLS or fallback to structural hls.js engine
    if (videoNode.canPlayType('application/vnd.apple.mpegurl')) {
      videoNode.src = manifestUrl;
    } else if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hlsEngine = new Hls({
        maxBufferLength: 30, // 30 seconds forward look-ahead buffer
        enableWorker: true,  // Smooth playback offloaded from main UI threads
      });

      hlsEngine.loadSource(manifestUrl);
      hlsEngine.attachMedia(videoNode);
      hlsRef.current = hlsEngine;
    }

    return () => {
      // Clean up locks and engines on unmount
      document.body.style.overflow = 'unset';
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, manifestUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center animate-fadeIn">
      {/* Top Overlay Controller Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10 text-white">
        <h2 className="text-xl font-bold font-sans tracking-wide">{videoTitle}</h2>
        <button 
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-transform active:scale-95"
        >
          <X size={24} />
        </button>
      </div>

      {/* Video Viewport */}
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
};
