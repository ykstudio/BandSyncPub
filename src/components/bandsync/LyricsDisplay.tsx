
'use client';

import type { ChordChange, LyricLine, LyricWord, SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useMemo } from 'react';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  chords: ChordChange[];
  sections: SongSection[];
  currentTime: number;
  activeSongChord: ChordChange | undefined;
  activeLyricWordInfo: {
    word: LyricWord;
    sectionId: string;
    lineIndexWithinSection: number;
  } | null;
}

const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

export function LyricsDisplay({ lyrics, chords, sections, currentTime, activeSongChord, activeLyricWordInfo }: LyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const renderedChordObjectsThisPass = useMemo(() => new Set<ChordChange>(), [lyrics, chords, sections, activeSongChord, activeLyricWordInfo, currentTime]);
  renderedChordObjectsThisPass.clear();

  useEffect(() => {
    if (!scrollContainerRef.current || !activeLyricWordInfo?.word) return;

    const { sectionId, lineIndexWithinSection } = activeLyricWordInfo;
    const targetKey = `${sectionId}_${lineIndexWithinSection}`;
    const targetElement = lineItemRefs.current[targetKey];

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [activeLyricWordInfo]);


  return (
    <div
      ref={scrollContainerRef}
      className="p-4 space-y-1 text-lg md:text-xl bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto scroll-smooth"
    >
      {sections.map((section, sectionIndex) => {
        const lyricLinesInSection = lyrics.filter(line => {
          if (line.length === 0) return false;
          const firstWordTime = line[0].startTime;
          return firstWordTime >= section.startTime && firstWordTime < section.endTime;
        });

        return (
          <div key={`section-${section.id}-${sectionIndex}`} className="mb-3">
            <h3
              className="text-base sm:text-lg font-semibold mt-3 mb-2 text-primary sticky top-0 bg-card py-1 z-10 border-b border-border"
              id={`section-header-${section.id}`}
            >
              {section.name}
            </h3>
            
            <div className="pt-5">
              {lyricLinesInSection.length > 0 ? (
                lyricLinesInSection.map((line, lineIdx) => (
                  <div
                    key={`line-${section.id}-${lineIdx}`}
                    ref={el => lineItemRefs.current[`${section.id}_${lineIdx}`] = el}
                    className="mb-6"
                  >
                    <p className="flex flex-wrap items-baseline gap-x-1.5">
                      {line.map((word, wordIndex) => {
                        const isThisTheCurrentActiveWord = activeLyricWordInfo?.word === word;
                        const chordToDisplay = getChordActiveAtTime(word.startTime, chords);
                        let shouldDisplayChordSymbol = false;

                        if (chordToDisplay && !renderedChordObjectsThisPass.has(chordToDisplay)) {
                          shouldDisplayChordSymbol = true;
                          renderedChordObjectsThisPass.add(chordToDisplay);
                        }

                        const isChordSymbolActive = activeSongChord && chordToDisplay === activeSongChord;
                        const isChordSymbolPast = !isChordSymbolActive && chordToDisplay && chordToDisplay.endTime < currentTime;


                        return (
                          <span
                            key={`word-${section.id}-${lineIdx}-${wordIndex}`}
                            className="relative inline-block pt-px"
                          >
                            {shouldDisplayChordSymbol && chordToDisplay && (
                              <span
                                className={cn(
                                  "absolute bottom-full left-0 translate-y-[5px] text-xs sm:text-sm font-semibold leading-none p-1 rounded-md",
                                  isChordSymbolActive 
                                    ? "bg-accent/20 text-accent font-bold" 
                                    : isChordSymbolPast
                                    ? "text-muted-foreground bg-muted/10"
                                    : "text-primary" // Upcoming chords are now just blue text
                                )}
                              >
                                {chordToDisplay.chord}
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
                ))
              ) : (
                <div className="flex flex-wrap gap-x-3 gap-y-1 my-2 px-1">
                  {chords.map((chord, chordIdx) => {
                    if (chord.startTime >= section.startTime && chord.startTime < section.endTime && !renderedChordObjectsThisPass.has(chord)) {
                      renderedChordObjectsThisPass.add(chord);
                      const isChordSymbolActive = activeSongChord === chord;
                      const isChordSymbolPast = !isChordSymbolActive && chord.endTime < currentTime;
                      return (
                        <span
                          key={`section-chord-${section.id}-${chordIdx}`}
                          className={cn(
                            "text-sm font-semibold p-1 rounded-md",
                            isChordSymbolActive 
                              ? "bg-accent/20 text-accent font-bold" 
                              : isChordSymbolPast
                              ? "text-muted-foreground bg-muted/10"
                              : "text-primary" // Upcoming chords are now just blue text
                          )}
                        >
                          {chord.chord}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {sections.length === 0 && lyrics.length === 0 && (
        <p className="text-muted-foreground">
          No lyrics or sections available for this song.
        </p>
      )}
    </div>
  );
}
