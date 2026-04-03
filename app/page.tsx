'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioWaveform } from '@/components/audio-waveform';

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('Trance 24x7 Stream');
  const [loading, setLoading] = useState(false);
  const [isUserActive, setIsUserActive] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-play on mount
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.play().catch(() => {
        console.log('Autoplay prevented by browser');
      });
    }

    // Fetch metadata on mount
    fetchMetadata();
    const interval = setInterval(fetchMetadata, 10000); // Update every 10 seconds

    // Track user activity
    const handleUserActivity = () => {
      setIsUserActive(true);
      // Clear existing timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      // Set new timeout for inactivity
      inactivityTimeoutRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, 30000); // 30 seconds of inactivity
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    // Initial activity
    handleUserActivity();

    return () => {
      clearInterval(interval);
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, []);

  const fetchMetadata = async () => {
    try {
      const response = await fetch(`/api/metadata?active=${isUserActive}`);
      const data = await response.json();
      setCurrentTrack(data.track || 'Trance 24x7 Stream');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setCurrentTrack('Unable to load track info');
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          setCurrentTrack('Error connecting to stream');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
      <audio
        ref={audioRef}
        src="https://mscp4.live-streams.nl:8092/radio"
        crossOrigin="anonymous"
        volume={volume}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-accent mb-2">
            Trance 24x7
          </h1>
          <p className="text-lg text-muted-foreground font-light">Lithiumwow</p>
        </div>

        {/* Main Player Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Audio Waveform */}
          <AudioWaveform />

          {/* Track Info */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Now Playing
            </p>
            <h2 className="text-2xl font-semibold text-card-foreground break-words">
              {currentTrack}
            </h2>
          </div>

          {/* Play Button */}
          <button
            onClick={togglePlay}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 mb-4 group active:scale-95"
          >
            {isPlaying ? (
              <>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </>
            )}
          </button>

          {/* Refresh Metadata Button */}
          <button
            onClick={fetchMetadata}
            className="w-full border border-accent/30 hover:border-accent/60 text-foreground py-2 px-4 rounded-xl transition-all duration-200 text-sm mb-6"
          >
            Refresh Metadata
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-muted-foreground flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-accent/20 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Refresh Metadata Button */}
          <button
            onClick={fetchMetadata}
            className="w-full border border-accent/30 hover:border-accent/60 text-foreground py-2 px-4 rounded-xl transition-all duration-200 text-sm"
          >
            Refresh Metadata
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Streaming 24/7</p>
        </div>
      </div>
    </div>
  );
}
