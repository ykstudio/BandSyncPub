
'use client';

import type { ChordChange, LyricLine } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  chords: ChordChange[];
}

const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

export function LyricsDisplay({ lyrics, currentTime, chords }: LyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const overallCurrentChord = getChordActiveAtTime(currentTime, chords);

  useEffect(() => {
    if (!scrollContainerRef.current || !lyrics || lyrics.length === 0) return;

    let activeWordElement: HTMLElement | null = null;
    let activeWordLineIndex = -1;
    let activeWordIndexInLine = -1;

    for (let lIdx = 0; lIdx < lyrics.length; lIdx++) {
      for (let wIdx = 0; wIdx < lyrics[lIdx].length; wIdx++) {
        const word = lyrics[lIdx][wIdx];
        if (currentTime >= word.startTime && currentTime < word.endTime) {
          activeWordLineIndex = lIdx;
          activeWordIndexInLine = wIdx;
          break;
        }
      }
      if (activeWordLineIndex !== -1) break;
    }

    if (activeWordLineIndex !== -1 && activeWordIndexInLine !== -1) {
      activeWordElement = document.getElementById(`word-${activeWordLineIndex}-${activeWordIndexInLine}`);
    }

    if (activeWordElement) {
      activeWordElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, lyrics]);

  return (
    <div
      ref={scrollContainerRef}
      className="p-4 space-y-1 text-lg md:text-xl bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto"
    >
      {lyrics.map((line, lineIndex) => {
        let lastChordTextDisplayedOnLine: string | null = null;

        return (
          <div key={lineIndex} className="mb-6">
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              {line.map((word, wordIndex) => {
                const isActiveWord = currentTime >= word.startTime && currentTime < word.endTime;
                const chordAssociatedWithWord = getChordActiveAtTime(word.startTime, chords);
                let chordToDisplayAboveWord: ChordChange | null = null;

                if (chordAssociatedWithWord) {
                  if (wordIndex === 0 || lastChordTextDisplayedOnLine !== chordAssociatedWithWord.chord) {
                    chordToDisplayAboveWord = chordAssociatedWithWord;
                    lastChordTextDisplayedOnLine = chordAssociatedWithWord.chord;
                  }
                } else {
                  lastChordTextDisplayedOnLine = null;
                }

                const isThisDisplayedChordTheOverallCurrent =
                  chordToDisplayAboveWord !== null &&
                  overallCurrentChord !== undefined &&
                  chordToDisplayAboveWord.chord === overallCurrentChord.chord &&
                  chordToDisplayAboveWord.startTime === overallCurrentChord.startTime;

                return (
                  <span
                    key={wordIndex}
                    id={`word-${lineIndex}-${wordIndex}`}
                    className="relative inline-block pt-px"
                  >
                    {chordToDisplayAboveWord && (
                      <span
                        className={cn(
                          "absolute bottom-full left-0 text-xs sm:text-sm font-semibold leading-none",
                          isThisDisplayedChordTheOverallCurrent ? "text-accent font-bold" : "text-primary"
                        )}
                      >
                        {chordToDisplayAboveWord.chord}
                      </span>
                    )}
                    <span
                      className={cn(
                        'transition-colors duration-100 leading-snug',
                        isActiveWord ? 'text-accent font-bold' : 'text-foreground'
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
