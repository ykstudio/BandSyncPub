
'use client';

import type { ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

interface ChordsDisplayProps {
  chords: ChordChange[];
  currentTime: number;
  songBpm: number;
  isPlaying: boolean;
}

export function ChordsDisplay({ chords, currentTime, songBpm, isPlaying }: ChordsDisplayProps) {
  const pulseDuration = songBpm > 0 ? 60 / songBpm : 0.5;
  const anticipationLeadTime = 0; 
  const targetDisplayTime = currentTime + anticipationLeadTime;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chordItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    chordItemRefs.current = chordItemRefs.current.slice(0, chords.length);
  }, [chords]);

  let visuallyCurrentChordIndex = -1;
  if (chords.length > 0) {
    visuallyCurrentChordIndex = chords.findIndex(c => targetDisplayTime >= c.startTime && targetDisplayTime < c.endTime);
    if (visuallyCurrentChordIndex === -1 && targetDisplayTime >= chords[chords.length -1].endTime) {
        // Past the last chord
    } else if (visuallyCurrentChordIndex === -1 && targetDisplayTime < chords[0].startTime) {
        // Before the first chord
    }
  }

  const visuallyCurrentChord = visuallyCurrentChordIndex !== -1 ? chords[visuallyCurrentChordIndex] : null;
  const visuallyPreviousChord = visuallyCurrentChordIndex > 0 ? chords[visuallyCurrentChordIndex - 1] : null;
  
  let visuallyNextChord: ChordChange | null = null;
  if (visuallyCurrentChordIndex !== -1 && visuallyCurrentChordIndex < chords.length - 1) {
    visuallyNextChord = chords[visuallyCurrentChordIndex + 1];
  } else if (visuallyCurrentChordIndex === -1 && chords.length > 0 && targetDisplayTime < chords[0].startTime) {
    // If before the first chord, the "next" is the first chord
    visuallyNextChord = chords[0];
  }


  useEffect(() => {
    if (scrollContainerRef.current) {
      let activeElement: HTMLDivElement | null = null;
      
      let elementToScrollToIndex = -1;

      if (visuallyCurrentChordIndex !== -1) {
        elementToScrollToIndex = visuallyCurrentChordIndex;
      } else if (visuallyNextChord) { 
        const nextChordGlobalIndex = chords.findIndex(c => c.startTime === visuallyNextChord!.startTime && c.chord === visuallyNextChord!.chord);
        if (nextChordGlobalIndex !== -1) {
          elementToScrollToIndex = nextChordGlobalIndex;
        }
      }

      if (elementToScrollToIndex !== -1 && chordItemRefs.current[elementToScrollToIndex]) {
        activeElement = chordItemRefs.current[elementToScrollToIndex];
      }
      
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'auto', 
          inline: 'center', 
          block: 'nearest', 
        });
      }
    }
  }, [visuallyCurrentChordIndex, visuallyNextChord, chords]); 


  const currentChordPulseDurationStr = pulseDuration.toFixed(2);

  return (
    <div className="p-4 bg-card rounded-lg shadow-md h-24 md:h-96 overflow-hidden">
      <div 
        ref={scrollContainerRef} 
        className={cn(
          "flex overflow-x-auto overflow-y-hidden h-full items-center",
          "space-x-4 md:space-x-6", 
          "py-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent", 
          "scroll-pl-32 md:scroll-pl-64 scroll-pr-32 md:scroll-pr-64" 
        )}
      >
        {chords.map((chord, index) => {
          const isVisuallyPrevious = chord === visuallyPreviousChord;
          const isVisuallyCurrent = chord === visuallyCurrentChord;
          const isVisuallyNext = chord === visuallyNextChord;

          let chordSpecificClasses = '';
          let animationClass = '';
          let animationStyle: React.CSSProperties = {};
          
          const baseKey = `${chord.chord}-${chord.startTime}-${index}`;

          if (isVisuallyPrevious) {
            chordSpecificClasses = 'text-muted-foreground opacity-75 transform translate-y-px text-3xl sm:text-5xl md:text-6xl leading-none';
          } else if (isVisuallyCurrent) {
            chordSpecificClasses = 'font-bold text-accent text-5xl sm:text-7xl md:text-9xl leading-none bg-accent-lightBg px-4 py-2 rounded-xl';
            if (isPlaying && songBpm > 0) {
              animationClass = 'animate-chord-bg-pulse';
              animationStyle = {
                animationDuration: `${currentChordPulseDurationStr}s`,
              };
            }
          } else if (isVisuallyNext) {
            chordSpecificClasses = 'text-primary text-6xl sm:text-8xl md:text-[10rem] leading-none';
          } else {
            chordSpecificClasses = 'text-muted-foreground text-2xl sm:text-3xl md:text-5xl opacity-60 leading-none';
          }

          return (
            <div
              key={baseKey}
              ref={el => chordItemRefs.current[index] = el}
              className={cn(
                'flex-shrink-0', 
                chordSpecificClasses,
                animationClass
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
