
'use client';

import type { ChordChange, LyricLine, LyricWord, SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useMemo } from 'react';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  chords: ChordChange[];
  sections: SongSection[];
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

export function LyricsDisplay({ lyrics, chords, sections, activeSongChord, activeLyricWordInfo }: LyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Memoize the set to avoid re-computation if props haven't changed identity
  const renderedChordObjectsThisPass = useMemo(() => new Set<ChordChange>(), [lyrics, chords, sections, activeSongChord, activeLyricWordInfo]);
  renderedChordObjectsThisPass.clear(); // Clear for the current render pass

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
            
            <div className="pt-5"> {/* Added padding here to fix chord cutoff */}
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
                        const chordForThisWord = getChordActiveAtTime(word.startTime, chords);
                        let shouldDisplayChordSymbol = false;

                        if (chordForThisWord && !renderedChordObjectsThisPass.has(chordForThisWord)) {
                          shouldDisplayChordSymbol = true;
                          renderedChordObjectsThisPass.add(chordForThisWord);
                        }

                        let highlightThisDisplayedChordSymbol = false;
                        if (shouldDisplayChordSymbol && chordForThisWord && activeSongChord && chordForThisWord === activeSongChord) {
                          highlightThisDisplayedChordSymbol = true;
                        }

                        return (
                          <span
                            key={`word-${section.id}-${lineIdx}-${wordIndex}`}
                            className="relative inline-block pt-px"
                          >
                            {shouldDisplayChordSymbol && chordForThisWord && (
                              <span
                                className={cn(
                                  "absolute bottom-full left-0 translate-y-[5px] text-xs sm:text-sm font-semibold leading-none p-1",
                                  highlightThisDisplayedChordSymbol 
                                    ? "bg-accent/20 text-accent font-bold rounded-md" 
                                    : "text-primary"
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
                ))
              ) : (
                <div className="flex flex-wrap gap-x-3 gap-y-1 my-2 px-1">
                  {chords.map((chord, chordIdx) => {
                    if (chord.startTime >= section.startTime && chord.startTime < section.endTime && !renderedChordObjectsThisPass.has(chord)) {
                      renderedChordObjectsThisPass.add(chord);
                      const isChordActive = activeSongChord === chord;
                      return (
                        <span
                          key={`section-chord-${section.id}-${chordIdx}`}
                          className={cn(
                            "text-sm font-semibold p-1 rounded-md",
                            isChordActive 
                              ? "bg-accent/20 text-accent font-bold" 
                              : "text-primary bg-primary/10"
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
