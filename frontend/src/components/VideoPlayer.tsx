import React, { useEffect, useRef } from 'react';
import hls from 'hls.js';

interface PlayerProps {
  manifestUrl: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<PlayerProps> = ({ manifestUrl, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoNode = videoRef.current;
    if (!videoNode) return;

    let hlsEngine: hls | null = null;

    if (videoNode.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (e.g. Safari, iOS)
      videoNode.src = manifestUrl;
    } else if (hls.isSupported()) {
      // Fallback using hls.js for Chrome, Firefox, etc.
      hlsEngine = new hls({
        maxBufferLength: 30,
        enableWorker: true,
      });

      hlsEngine.loadSource(manifestUrl);
      hlsEngine.attachMedia(videoNode);
    }

    return () => {
      if (hlsEngine) {
        hlsEngine.destroy();
      }
    };
  }, [manifestUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="relative w-full max-w-5xl px-4">
        
        {/* Close Overlay Button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-4 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-sm font-semibold"
        >
          ✕ Close Player
        </button>

        <div className="overflow-hidden rounded-xl bg-black border border-white/10 shadow-2xl">
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full h-auto aspect-video"
            playsInline
          />
        </div>
      </div>
    </div>
  );
};
