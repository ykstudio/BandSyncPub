'use client';

import { cn } from '@/lib/utils';
import React from 'react'; // Removed useState, useEffect

interface MetronomeProps {
  bpm: number;
  isPlaying: boolean;
}

export function Metronome({ bpm, isPlaying }: MetronomeProps) {
  const pulseDuration = bpm > 0 ? 60 / bpm : 0.5; // Default if bpm is 0 or invalid to prevent division by zero

  return (
    <div className="flex flex-col items-center md:items-start"> {/* Retains overall alignment from parent */}
      <div className="flex items-center gap-1.5"> {/* BPM number and Bulb */}
        <span className="text-sm font-semibold text-primary">{bpm}</span> {/* BPM Value */}
        <div
          className={cn(
            'w-3 h-3 rounded-full', // Base style for the bulb, made it slightly smaller
            // Conditionally apply animation class for pulsing effect
            { 'animate-metronome-pulse': isPlaying && bpm > 0 } 
          )}
          style={{
            // Set animation duration only when animating
            animationDuration: isPlaying && bpm > 0 ? `${pulseDuration}s` : undefined,
            // Determine background color based on play state
            backgroundColor: isPlaying && bpm > 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--muted))',
            // Set opacity and transform for non-playing state; CSS animation handles these when playing
            opacity: !(isPlaying && bpm > 0) ? 0.5 : undefined, 
            transform: !(isPlaying && bpm > 0) ? 'scale(1)' : undefined,
          }}
          aria-hidden="true"
        />
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">BPM</div> {/* "BPM" label */}
    </div>
  );
}
