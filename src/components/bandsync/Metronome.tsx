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
      <div className="text-sm text-muted-foreground mb-1">Metronome: {bpm} BPM</div>
      <div
        className={cn(
          'w-8 h-8 rounded-full bg-primary transition-all duration-100 ease-in-out',
          'animate-metronome-pulse'
        )}
        style={{
          animationDuration: `${pulseDuration}s`,
          opacity: isPlaying && isPulsing ? 1 : 0.3,
          transform: isPlaying && isPulsing ? 'scale(1.1)' : 'scale(1)',
          backgroundColor: isPlaying ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
        }}
        aria-hidden="true"
      />
    </div>
  );
}
