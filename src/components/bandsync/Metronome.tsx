
'use client';

import { cn } from '@/lib/utils';
import React from 'react';

interface MetronomeProps {
  bpm: number;
  isPlaying: boolean;
}

export function Metronome({ bpm, isPlaying }: MetronomeProps) {
  const pulseDuration = bpm > 0 ? 60 / bpm : 0.5;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-primary">{bpm}</span>
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          { 'animate-metronome-pulse': isPlaying && bpm > 0 }
        )}
        style={{
          animationDuration: isPlaying && bpm > 0 ? `${pulseDuration}s` : undefined,
          backgroundColor: isPlaying && bpm > 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--muted))',
          opacity: !(isPlaying && bpm > 0) ? 0.5 : undefined,
          transform: !(isPlaying && bpm > 0) ? 'scale(1)' : undefined,
        }}
        aria-hidden="true"
      />
      <span className="text-xs text-muted-foreground">BPM</span>
    </div>
  );
}
