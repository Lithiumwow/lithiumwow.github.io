'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';

export function AudioWaveform() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(30).fill(0.3));
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const audioElement = document.querySelector('audio') as HTMLAudioElement;
    if (!audioElement) return;

    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };

    // Check immediate state
    if (!audioElement.paused) {
      setIsPlaying(true);
    }

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('playing', handlePlay);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('playing', handlePlay);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setBars(Array(30).fill(0.2));
      return;
    }

    const animate = () => {
      phaseRef.current += 0.08;

      const newBars = Array.from({ length: 30 }, (_, i) => {
        const position = i / 30;
        
        // Create multiple sine waves with larger amplitudes for more dramatic peaks and valleys
        const wave1 = Math.sin(position * Math.PI * 2 + phaseRef.current) * 0.45;
        const wave2 = Math.sin(position * Math.PI * 4 + phaseRef.current * 0.7) * 0.25;
        const wave3 = Math.sin(position * Math.PI * 6 + phaseRef.current * 1.3) * 0.15;
        
        // Add some randomness that changes smoothly
        const randomInfluence = Math.sin(i * 0.5 + phaseRef.current * 0.3) * 0.1;
        
        // Lower base value and larger wave amplitudes for better high/low contrast
        const value = 0.3 + wave1 + wave2 + wave3 + randomInfluence;
        return Math.max(Math.min(value, 1), 0.05);
      });

      setBars(newBars);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mounted, isPlaying]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl mb-8 flex items-center justify-center border border-accent/10" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full aspect-square bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl mb-8 flex items-center justify-center border border-accent/10 hover:border-accent/30 transition-all duration-300 cursor-pointer group hover:shadow-lg"
    >
      <div className="flex items-center justify-center gap-0.5 h-full w-full px-6">
        {bars.map((height, index) => (
          <div
            key={index}
            className="bg-accent/70 group-hover:bg-accent rounded-full origin-bottom flex-1"
            style={{
              height: `${Math.max(height * 240, 8)}px`,
              opacity: 0.5 + height * 0.5,
              transition: 'height 0.06s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>
    </button>
  );
}
