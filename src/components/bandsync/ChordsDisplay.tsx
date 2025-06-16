
'use client';

import type { ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import { Metronome } from './Metronome';

interface ChordsDisplayProps {
  chords: ChordChange[];
  currentTime: number;
  songBpm: number;
  isPlaying: boolean;
}

export function ChordsDisplay({ chords, currentTime, songBpm, isPlaying }: ChordsDisplayProps) {
  const pulseDuration = songBpm > 0 ? 60 / songBpm : 0.5;
  const targetDisplayTime = currentTime; 

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
    visuallyNextChord = chords[0];
  }


  useEffect(() => {
    if (!scrollContainerRef.current || chords.length === 0) {
      return;
    }

    const container = scrollContainerRef.current;
    
    const animationFrameId = requestAnimationFrame(() => {
      // Calculations that depend on DOM layout (offsetWidth, offsetLeft) are now inside rAF
      const containerCenter = container.offsetWidth / 2;

      const getElementScrollToCenter = (element: HTMLDivElement | null): number | null => {
        if (!element) return null;
        const elementCenterRelativeToContainer = element.offsetLeft + element.offsetWidth / 2;
        return elementCenterRelativeToContainer - containerCenter;
      };

      let targetScrollLeft: number | null = null;

      const currentChordGlobalIndex = visuallyCurrentChord ? chords.indexOf(visuallyCurrentChord) : -1;
      const nextChordGlobalIndex = visuallyNextChord ? chords.indexOf(visuallyNextChord) : -1;

      const currentChordEl = currentChordGlobalIndex !== -1 ? chordItemRefs.current[currentChordGlobalIndex] : null;
      const nextChordEl = nextChordGlobalIndex !== -1 ? chordItemRefs.current[nextChordGlobalIndex] : null;

      if (visuallyCurrentChord && currentChordEl) {
        const scrollPosForCurrentChord = getElementScrollToCenter(currentChordEl);

        if (scrollPosForCurrentChord === null) return;

        if (visuallyNextChord && nextChordEl) {
          const scrollPosForNextChord = getElementScrollToCenter(nextChordEl);

          if (scrollPosForNextChord === null) {
              targetScrollLeft = scrollPosForCurrentChord;
          } else {
              const chordDuration = visuallyCurrentChord.endTime - visuallyCurrentChord.startTime;
              if (chordDuration > 0) {
              const timeIntoChord = currentTime - visuallyCurrentChord.startTime;
              let progress = timeIntoChord / chordDuration;
              progress = Math.min(1, Math.max(0, progress)); 

              targetScrollLeft = scrollPosForCurrentChord + (scrollPosForNextChord - scrollPosForCurrentChord) * progress;
              } else {
               targetScrollLeft = (currentTime >= visuallyCurrentChord.endTime) ? scrollPosForNextChord : scrollPosForCurrentChord;
              }
          }
        } else {
          targetScrollLeft = scrollPosForCurrentChord;
        }
      } else if (visuallyNextChord && nextChordEl) {
        targetScrollLeft = getElementScrollToCenter(nextChordEl);
      } else if (chords.length > 0 && chordItemRefs.current[0] && getElementScrollToCenter(chordItemRefs.current[0]) !== null) {
        targetScrollLeft = getElementScrollToCenter(chordItemRefs.current[0]);
      } else {
        targetScrollLeft = 0;
      }
      
      if (targetScrollLeft !== null && Math.abs(container.scrollLeft - targetScrollLeft) > 0.5) {
        container.scrollLeft = targetScrollLeft;
      }
    });
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentTime, chords, visuallyCurrentChord, visuallyNextChord]);


  const currentChordPulseDurationStr = pulseDuration.toFixed(2);

  return (
    <div 
      className={cn(
        "relative rounded-lg shadow-md h-full overflow-hidden",
        "md:pt-4 md:px-4" 
      )}
      style={{ backgroundColor: 'hsl(var(--chords-panel-background))' }}
    >
      <div 
        className="absolute top-0 right-0 md:top-2 md:right-2 z-10 p-2 rounded-md"
        style={{ backgroundColor: 'hsl(var(--metronome-background-in-chords-panel))' }}
      >
        <Metronome bpm={songBpm} isPlaying={isPlaying} />
      </div>
      <div 
        ref={scrollContainerRef} 
        className={cn(
          "flex overflow-x-auto overflow-y-hidden h-full items-center",
          "space-x-4 md:space-x-6", 
          "pt-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent", 
          "scroll-pl-[50vw] scroll-pr-[50vw]", 
          "md:scroll-pl-64 md:scroll-pr-64" 
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

          const indexOfNextChord = visuallyNextChord ? chords.indexOf(visuallyNextChord) : -1;
          const indexOfCurrentChord = visuallyCurrentChord ? chords.indexOf(visuallyCurrentChord) : -1;

          if (isVisuallyPrevious) {
            chordSpecificClasses = 'text-muted-foreground opacity-75 transform translate-y-px text-3xl sm:text-5xl md:text-6xl leading-none';
          } else if (isVisuallyCurrent) {
            chordSpecificClasses = 'font-bold text-5xl sm:text-7xl md:text-9xl leading-none bg-accent-lightBg px-4 py-2 rounded-xl';
            if (isPlaying && songBpm > 0) {
              animationClass = 'animate-chord-bg-pulse';
              animationStyle.animationDuration = `${currentChordPulseDurationStr}s`;
            }
            animationStyle.color = 'hsl(var(--current-chord-text))';
          } else if (isVisuallyNext) {
            chordSpecificClasses = 'text-primary text-6xl sm:text-8xl md:text-[10rem] leading-none';
          } else if ( (indexOfNextChord !== -1 && index > indexOfNextChord) || (indexOfNextChord === -1 && indexOfCurrentChord !== -1 && index > indexOfCurrentChord) ) {
            chordSpecificClasses = 'text-primary opacity-90 text-2xl sm:text-3xl md:text-5xl leading-none';
          }
           else {
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

