'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

interface MetronomeProps {
  bpm: number;
  isPlaying: boolean;
}

export function Metronome({ bpm, isPlaying }: MetronomeProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseDuration = 60 / bpm; // in seconds

  useEffect(() => {
    let pulseTimeout: NodeJS.Timeout;
    if (isPlaying && bpm > 0) {
      const animatePulse = () => {
        setIsPulsing(true);
        pulseTimeout = setTimeout(() => {
          setIsPulsing(false);
        }, pulseDuration * 1000 / 2); // Pulse visible for half the duration
      };
      
      const intervalId = setInterval(animatePulse, pulseDuration * 1000);
      animatePulse(); // Initial pulse

      return () => {
        clearInterval(intervalId);
        clearTimeout(pulseTimeout);
        setIsPulsing(false);
      };
    } else {
      setIsPulsing(false);
    }
  }, [bpm, isPlaying, pulseDuration]);

  return (
    <div className="flex flex-col items-center md:items-start">
      <div className="text-sm text-muted-foreground">Metronome: {bpm}</div>
      <div className="text-xs text-muted-foreground -mt-1 mb-1">BPM</div>
      <div
        className={cn(
          'w-4 h-4 rounded-full transition-all duration-100 ease-in-out', // Smaller size
          'animate-metronome-pulse'
        )}
        style={{
          animationDuration: `${pulseDuration}s`,
          opacity: isPlaying && isPulsing ? 1 : 0.3,
          transform: isPlaying && isPulsing ? 'scale(1.1)' : 'scale(1)',
          backgroundColor: isPlaying ? 'hsl(var(--chart-2))' : 'hsl(var(--muted))' // Green color when playing
        }}
        aria-hidden="true"
      />
    </div>
  );
}
