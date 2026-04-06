'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioWaveform } from '@/components/audio-waveform';
import { LanderGame } from '@/components/lander-game';

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack] = useState('Trance 24x7 Stream');
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (audioElement) {
      audioElement.volume = volume;
      audioElement.play().catch(() => {
        console.log('Autoplay prevented by browser');
      });
    }

    const unlockPlayback = () => {
      const target = audioRef.current;
      if (!target) return;

      target.play().catch(() => {
        console.log('Playback still blocked until direct play button press');
      });
    };

    window.addEventListener('pointerdown', unlockPlayback, { once: true });
    window.addEventListener('keydown', unlockPlayback, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockPlayback);
      window.removeEventListener('keydown', unlockPlayback);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          console.log('Unable to start playback');
        });
      }
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
    <div className="min-h-screen w-full bg-background text-foreground flex items-start justify-center p-4 py-10">
      <audio
        ref={audioRef}
        src="https://mscp4.live-streams.nl:8092/radio"
        crossOrigin="anonymous"
        autoPlay
        playsInline
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-accent mb-2">
            Trance 24x7
          </h1>
          <p className="text-lg text-muted-foreground font-light">Lithiumwow</p>
          <a
            href="#play-lander"
            className="inline-flex items-center gap-2 mt-3 text-sm text-accent hover:text-accent/80 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11 2l6 5v9a4 4 0 01-4 4H7a4 4 0 01-4-4V7l6-5h2zm0 3.2L5 9v7a2 2 0 002 2h6a2 2 0 002-2V9l-6-3.8zM8.5 12.5l3.5-2 3.5 2-.9 1.6-2.6-1.5-2.6 1.5-.9-1.6z" />
            </svg>
            Play Lander
          </a>
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
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Streaming 24/7</p>
        </div>

        <LanderGame />
      </div>
    </div>
  );
}
