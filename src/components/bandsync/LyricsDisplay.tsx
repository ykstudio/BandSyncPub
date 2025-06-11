
'use client';

import type { ChordChange, LyricLine, LyricWord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useMemo } from 'react';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  chords: ChordChange[]; // This is songData.chords
  activeSongChord: ChordChange | undefined; // The single chord active in the song right now, derived from currentTime
  activeLyricWordInfo: { lineIndex: number; wordIndex: number; word: LyricWord } | null;
}

const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

export function LyricsDisplay({ lyrics, chords, activeSongChord, activeLyricWordInfo }: LyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Memoize the set to avoid re-computation on every render if lyrics/chords don't change
  // This set will track which ChordChange objects have had their symbol rendered in this pass.
  const renderedChordObjectsThisPass = useMemo(() => new Set<ChordChange>(), [lyrics, chords]);
  // We must clear this set on each render pass if lyrics/chords could change props and cause a re-render
  // For this component's lifecycle, it's simpler to re-initialize on each render:
  renderedChordObjectsThisPass.clear();


  useEffect(() => {
    if (!scrollContainerRef.current || !activeLyricWordInfo) return;

    const activeWordElement = document.getElementById(`word-${activeLyricWordInfo.lineIndex}-${activeLyricWordInfo.wordIndex}`);

    if (activeWordElement) {
      activeWordElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricWordInfo]);

  return (
    <div
      ref={scrollContainerRef}
      className="p-4 space-y-1 text-lg md:text-xl bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto"
    >
      {lyrics.map((line, lineIndex) => {
        return (
          <div key={lineIndex} className="mb-6">
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              {line.map((word, wordIndex) => {
                const isThisTheCurrentActiveWord = activeLyricWordInfo?.lineIndex === lineIndex && activeLyricWordInfo?.wordIndex === wordIndex;
                
                const chordForThisWord = getChordActiveAtTime(word.startTime, chords);
                let shouldDisplayChordSymbol = false;

                if (chordForThisWord && !renderedChordObjectsThisPass.has(chordForThisWord)) {
                  shouldDisplayChordSymbol = true;
                  renderedChordObjectsThisPass.add(chordForThisWord);
                }
                
                let highlightThisDisplayedChordSymbol = false;
                // Highlight only if we ARE displaying it AND it's the activeSongChord
                if (shouldDisplayChordSymbol && chordForThisWord && activeSongChord && chordForThisWord === activeSongChord) {
                  highlightThisDisplayedChordSymbol = true;
                }

                return (
                  <span
                    key={wordIndex}
                    id={`word-${lineIndex}-${wordIndex}`}
                    className="relative inline-block pt-px" 
                  >
                    {shouldDisplayChordSymbol && chordForThisWord && (
                      <span
                        className={cn(
                          "absolute bottom-full left-0 translate-y-[5px] text-xs sm:text-sm font-semibold leading-none",
                          highlightThisDisplayedChordSymbol ? "text-accent font-bold" : "text-primary"
                        )}
                      >
                        {chordForThisWord.chord}
                      </span>
                    )}
                    <span
                      className={cn(
                        'transition-colors duration-100 leading-snug',
                        isThisTheCurrentActiveWord ? 'text-accent font-bold' : 'text-foreground'
                      )}
                    >
                      {word.text}
                    </span>
                  </span>
                );
              })}
            </p>
          </div>
        );
      })}
      {lyrics.length === 0 && (
        <p className="text-muted-foreground">
          No lyrics available for this song.
        </p>
      )}
    </div>
  );
}
