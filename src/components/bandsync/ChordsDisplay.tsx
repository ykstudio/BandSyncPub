
'use client';

import type { ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

interface ChordsDisplayProps {
  chords: ChordChange[];
  currentTime: number;
  songBpm: number;
}

export function ChordsDisplay({ chords, currentTime, songBpm }: ChordsDisplayProps) {
  const pulseDuration = songBpm > 0 ? 60 / songBpm : 0.5;
  const anticipationLeadTime = pulseDuration; // Look ahead one beat
  const targetDisplayTime = currentTime + anticipationLeadTime;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chordItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ensure refs array is always the correct size for the sections
  useEffect(() => {
    chordItemRefs.current = chordItemRefs.current.slice(0, chords.length);
  }, [chords]);

  let visuallyCurrentChordIndex = -1;
  if (chords.length > 0) {
    visuallyCurrentChordIndex = chords.findIndex(c => targetDisplayTime >= c.startTime && targetDisplayTime < c.endTime);
    if (visuallyCurrentChordIndex === -1 && targetDisplayTime < chords[0].startTime && chords[0].startTime - targetDisplayTime < pulseDuration * 1.5) {
        // Handled by next/prev logic if close to start
    } else if (visuallyCurrentChordIndex === -1 && targetDisplayTime >= chords[chords.length -1].endTime) {
        // Past the last chord
    } else if (visuallyCurrentChordIndex === -1 && chords.length > 0 && targetDisplayTime < chords[0].startTime) {
        // Before the first chord
    }
  }

  const visuallyCurrentChord = visuallyCurrentChordIndex !== -1 ? chords[visuallyCurrentChordIndex] : null;
  
  const visuallyPreviousChord = visuallyCurrentChordIndex > 0 ? chords[visuallyCurrentChordIndex - 1] : 
                                (visuallyCurrentChordIndex === 0 && currentTime < (chords[0]?.startTime ?? Infinity) ? null : undefined); 
  
  let visuallyNextChord: ChordChange | null = null;
  if (visuallyCurrentChordIndex !== -1 && visuallyCurrentChordIndex < chords.length - 1) {
    visuallyNextChord = chords[visuallyCurrentChordIndex + 1];
  } else if (visuallyCurrentChordIndex === -1 && chords.length > 0 && targetDisplayTime < chords[0].startTime) {
    visuallyNextChord = chords[0];
  }

  useEffect(() => {
    if (scrollContainerRef.current) {
      let activeElement: HTMLDivElement | null = null;
      if (visuallyCurrentChordIndex !== -1 && chordItemRefs.current[visuallyCurrentChordIndex]) {
        activeElement = chordItemRefs.current[visuallyCurrentChordIndex];
      } else if (visuallyNextChord && visuallyNextChord === chords[0] && chordItemRefs.current[0]) {
        // If no current, but next is the first chord, scroll to first chord
        activeElement = chordItemRefs.current[0];
      }
      
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest', 
        });
      }
    }
  }, [visuallyCurrentChordIndex, visuallyNextChord, chords]);


  const pulseDurationStr = pulseDuration.toFixed(2);

  return (
    <div className="p-4 bg-card rounded-lg shadow-md h-24 md:h-96">
      <div 
        ref={scrollContainerRef} 
        className="flex overflow-x-auto h-full items-end space-x-6 py-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {chords.map((chord, index) => {
          const isVisuallyPrevious = chord === visuallyPreviousChord;
          const isVisuallyCurrent = chord === visuallyCurrentChord;
          const isVisuallyNext = chord === visuallyNextChord;

          let chordSpecificClasses = '';
          let animationStyle: React.CSSProperties = {};

          if (isVisuallyPrevious) {
            chordSpecificClasses = 'text-muted-foreground opacity-75 transform translate-y-1 text-4xl sm:text-5xl md:text-7xl leading-none';
          } else if (isVisuallyCurrent) {
            chordSpecificClasses = 'font-bold text-accent text-6xl sm:text-8xl md:text-[10rem] leading-none';
            animationStyle = {
              animationName: 'metronome-pulse',
              animationDuration: `${pulseDurationStr}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            };
          } else if (isVisuallyNext) {
            chordSpecificClasses = 'text-primary text-7xl sm:text-9xl md:text-[12rem] leading-none';
          } else {
            // Default style for other chords in the line
            chordSpecificClasses = 'text-muted-foreground text-3xl sm:text-4xl md:text-6xl opacity-60 leading-none';
          }

          return (
            <div
              key={`${chord.chord}-${chord.startTime}`}
              ref={el => chordItemRefs.current[index] = el}
              className={cn(
                'flex-shrink-0 p-1', 
                chordSpecificClasses
              )}
              style={animationStyle}
            >
              {chord.chord}
            </div>
          );
        })}
      </div>
    </div>
  );
}
