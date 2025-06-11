
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
  const pulseDuration = songBpm > 0 ? 60 / songBpm : 0.5; // Ensure pulseDuration is at least 0.5s
  const anticipationLeadTime = pulseDuration; // Look ahead one beat
  const targetDisplayTime = currentTime + anticipationLeadTime;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chordItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Ensure refs array is always the correct size for the sections
    chordItemRefs.current = chordItemRefs.current.slice(0, chords.length);
  }, [chords]);

  // Determine visually current, previous, and next chords based on targetDisplayTime
  let visuallyCurrentChordIndex = -1;
  if (chords.length > 0) {
    visuallyCurrentChordIndex = chords.findIndex(c => targetDisplayTime >= c.startTime && targetDisplayTime < c.endTime);
    
    // Handle edge case: if before the first chord but very close to its start,
    // visuallyCurrentChordIndex might be -1. We want to ensure the logic below can pick up the first chord as "next".
    if (visuallyCurrentChordIndex === -1 && targetDisplayTime < chords[0].startTime && chords[0].startTime - targetDisplayTime < pulseDuration * 1.5) {
        // Let the next/prev logic handle this if we're close to the start
    } else if (visuallyCurrentChordIndex === -1 && targetDisplayTime >= chords[chords.length -1].endTime) {
        // Past the last chord, current will be null
    } else if (visuallyCurrentChordIndex === -1 && chords.length > 0 && targetDisplayTime < chords[0].startTime) {
        // Before the first chord, current will be null
    }
  }

  const visuallyCurrentChord = visuallyCurrentChordIndex !== -1 ? chords[visuallyCurrentChordIndex] : null;
  
  // Determine visually previous chord
  // If current is the first chord, previous is null.
  // If current is null and we are past the end, previous might be the last chord.
  // If current is null and we are before the start, previous is null.
  const visuallyPreviousChord = visuallyCurrentChordIndex > 0 ? chords[visuallyCurrentChordIndex - 1] : 
                                (visuallyCurrentChordIndex === 0 && currentTime < (chords[0]?.startTime ?? Infinity) ? null : undefined); 
                                // undefined allows "other" chords to render normally if no specific prev/curr/next
  
  // Determine visually next chord
  let visuallyNextChord: ChordChange | null = null;
  if (visuallyCurrentChordIndex !== -1 && visuallyCurrentChordIndex < chords.length - 1) {
    visuallyNextChord = chords[visuallyCurrentChordIndex + 1];
  } else if (visuallyCurrentChordIndex === -1 && chords.length > 0 && targetDisplayTime < chords[0].startTime) {
    // If current is null because we're before the first chord, the first chord is "next"
    visuallyNextChord = chords[0];
  }


  useEffect(() => {
    if (scrollContainerRef.current) {
      let activeElement: HTMLDivElement | null = null;
      // Prioritize scrolling to current chord if it exists
      if (visuallyCurrentChordIndex !== -1 && chordItemRefs.current[visuallyCurrentChordIndex]) {
        activeElement = chordItemRefs.current[visuallyCurrentChordIndex];
      } 
      // If no current chord, but there's a "next" chord (typically the first chord of the song/section)
      else if (visuallyNextChord && chordItemRefs.current.length > 0) {
        const nextChordGlobalIndex = chords.findIndex(c => c === visuallyNextChord);
        if (nextChordGlobalIndex !== -1 && chordItemRefs.current[nextChordGlobalIndex]) {
            activeElement = chordItemRefs.current[nextChordGlobalIndex];
        }
      }
      
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center', 
          block: 'nearest', 
        });
      }
    }
  }, [visuallyCurrentChordIndex, visuallyNextChord, chords]); // Rerun when these change


  const currentChordPulseDurationStr = pulseDuration.toFixed(2);

  return (
    <div className="p-4 bg-card rounded-lg shadow-md h-24 md:h-96 overflow-hidden">
      <div 
        ref={scrollContainerRef} 
        className="flex overflow-x-auto overflow-y-hidden h-full items-end space-x-6 py-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent scroll-smooth scroll-pr-64"
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
              animationDuration: `${currentChordPulseDurationStr}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            };
          } else if (isVisuallyNext) {
            chordSpecificClasses = 'text-primary text-7xl sm:text-9xl md:text-[12rem] leading-none';
          } else {
            // Default style for other chords in the line (further away)
            chordSpecificClasses = 'text-muted-foreground text-3xl sm:text-4xl md:text-6xl opacity-60 leading-none';
          }

          return (
            <div
              key={`${chord.chord}-${chord.startTime}`}
              ref={el => chordItemRefs.current[index] = el}
              className={cn(
                'flex-shrink-0 p-1', // p-1 to give a tiny bit of breathing room if chords are very close
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
