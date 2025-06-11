
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
    lineIndexWithinSection: number; // Index within the filtered lines for that section
  } | null;
  currentSectionId: string | null;
}

const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

export function LyricsDisplay({ lyrics, chords, sections, currentTime, activeSongChord, activeLyricWordInfo, currentSectionId }: LyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionHeaderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevCurrentSectionIdRef = useRef<string | null>(null);

  const renderedChordObjectsThisPass = useMemo(() => new Set<ChordChange>(), [lyrics, chords, sections, activeSongChord, activeLyricWordInfo, currentTime, currentSectionId]);
  renderedChordObjectsThisPass.clear();

  const { activeLineKeyForHighlight, scrollTargetLineKey } = useMemo(() => {
    let highlightKey: string | null = null;
    let targetScrollKey: string | null = null;

    if (activeLyricWordInfo) {
        highlightKey = `${activeLyricWordInfo.sectionId}_${activeLyricWordInfo.lineIndexWithinSection}`;

        const currentSectionIdxInAllSections = sections.findIndex(s => s.id === activeLyricWordInfo.sectionId);
        
        if (currentSectionIdxInAllSections !== -1) {
            const linesFilteredForCurrentSection = lyrics.filter(line => {
                if (line.length === 0) return false;
                const firstWordTime = line[0].startTime;
                return firstWordTime >= sections[currentSectionIdxInAllSections].startTime && firstWordTime < sections[currentSectionIdxInAllSections].endTime;
            });

            if (activeLyricWordInfo.lineIndexWithinSection + 1 < linesFilteredForCurrentSection.length) {
                targetScrollKey = `${activeLyricWordInfo.sectionId}_${activeLyricWordInfo.lineIndexWithinSection + 1}`;
            } else {
                for (let i = currentSectionIdxInAllSections + 1; i < sections.length; i++) {
                    const nextOverallSection = sections[i];
                    const linesFilteredForNextOverallSection = lyrics.filter(line =>
                        line.length > 0 &&
                        line[0].startTime >= nextOverallSection.startTime &&
                        line[0].startTime < nextOverallSection.endTime
                    );
                    if (linesFilteredForNextOverallSection.length > 0) {
                        targetScrollKey = `${nextOverallSection.id}_0`; 
                        break;
                    }
                }
            }
        }
    }

    if (!targetScrollKey) {
        let earliestNextTime = Infinity;
        let candidateKey: string | null = null;

        for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
            const section = sections[sectionIndex];
            const linesFilteredForThisSection = lyrics.filter(line => 
                line.length > 0 && 
                line[0].startTime >= section.startTime && 
                line[0].startTime < section.endTime
            );

            linesFilteredForThisSection.forEach((line, lineIdxInSection) => {
                if (line.length > 0 && line[0].startTime >= currentTime) {
                    if (line[0].startTime < earliestNextTime) {
                        earliestNextTime = line[0].startTime;
                        candidateKey = `${section.id}_${lineIdxInSection}`;
                    }
                }
            });
        }
        if (candidateKey) {
            targetScrollKey = candidateKey;
        }
    }
    
    // If no active lyric, but we are before the first lyric of the song, ensure the first line is the scroll target.
    if (!activeLyricWordInfo && !targetScrollKey && lyrics.length > 0 && lyrics[0].length > 0 && currentTime < lyrics[0][0].startTime) {
      const firstSection = sections.find(s => lyrics[0][0].startTime >= s.startTime && lyrics[0][0].startTime < s.endTime);
      if (firstSection) {
        const linesInFirstSection = lyrics.filter(line => line.length > 0 && line[0].startTime >= firstSection.startTime && line[0].startTime < firstSection.endTime);
        if (linesInFirstSection.length > 0 && linesInFirstSection[0] === lyrics[0]) {
            targetScrollKey = `${firstSection.id}_0`;
        }
      }
    }


    return { activeLineKeyForHighlight: highlightKey, scrollTargetLineKey: targetScrollKey };
  }, [lyrics, sections, currentTime, activeLyricWordInfo]);


  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const isNewSectionJustActivated = currentSectionId !== null && prevCurrentSectionIdRef.current !== currentSectionId;
    let scrolledThisUpdate = false;

    if (isNewSectionJustActivated && currentSectionId) {
      const sectionHeaderElement = sectionHeaderRefs.current[currentSectionId];
      if (sectionHeaderElement) {
        sectionHeaderElement.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
        scrolledThisUpdate = true;
      }
    } 
    
    if (!scrolledThisUpdate && scrollTargetLineKey) {
      const targetLineElement = lineItemRefs.current[scrollTargetLineKey];
      if (targetLineElement) {
        targetLineElement.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
        scrolledThisUpdate = true;
      }
    }
    
    if (!scrolledThisUpdate && activeLineKeyForHighlight && !isNewSectionJustActivated) {
      const activeLineElement = lineItemRefs.current[activeLineKeyForHighlight];
      if (activeLineElement) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const elementRect = activeLineElement.getBoundingClientRect();
        if (elementRect.bottom > containerRect.bottom - 20 || elementRect.top < containerRect.top + 20) {
            activeLineElement.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
            scrolledThisUpdate = true; 
        }
      }
    }
    
    if (!scrolledThisUpdate && currentSectionId && !activeLyricWordInfo && !isNewSectionJustActivated) {
      const sectionHeaderElement = sectionHeaderRefs.current[currentSectionId];
      if (sectionHeaderElement) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const elementRect = sectionHeaderElement.getBoundingClientRect();
        if (elementRect.top < containerRect.top || elementRect.top > containerRect.top + containerRect.height / 3) { 
            sectionHeaderElement.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
        }
      }
    }

    if (currentSectionId !== prevCurrentSectionIdRef.current) {
      prevCurrentSectionIdRef.current = currentSectionId;
    }
  }, [scrollTargetLineKey, activeLineKeyForHighlight, currentSectionId, activeLyricWordInfo]);


  return (
    <div
      ref={scrollContainerRef}
      className="space-y-1 text-lg md:text-xl bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-scroll border border-border"
    >
      {sections.map((section, sectionIndex) => {
        const lyricLinesInSection = lyrics.filter(line => {
          if (line.length === 0) return false;
          const firstWordTime = line[0].startTime;
          return firstWordTime >= section.startTime && firstWordTime < section.endTime;
        });

        const isActiveSection = section.id === currentSectionId;

        return (
          <div key={`section-${section.id}-${sectionIndex}`} className="mb-3">
            <h3
              ref={el => sectionHeaderRefs.current[section.id] = el}
              className={cn(
                "text-base sm:text-lg font-semibold sticky top-0 py-2 z-10 border-b border-border pl-4",
                isActiveSection 
                  ? "text-accent font-bold bg-accent-lightBg" 
                  : "text-primary bg-card"
              )}
              id={`section-header-${section.id}`}
            >
              {section.name}
            </h3>
            
            <div className="pt-16 px-4"> 
              {lyricLinesInSection.length > 0 ? (
                lyricLinesInSection.map((line, lineIdx) => {
                  const lineKey = `${section.id}_${lineIdx}`;
                  const isCurrentLineActive = activeLineKeyForHighlight === lineKey;
                  
                  return (
                    <div
                      key={`line-${section.id}-${lineIdx}`}
                      ref={el => lineItemRefs.current[lineKey] = el}
                      className="mb-6"
                    >
                      <p className="flex flex-wrap items-baseline gap-x-1.5">
                        {line.map((word, wordIndex) => {
                          const isThisTheCurrentSingingWord = activeLyricWordInfo?.word === word;
                          const isWordPast = currentTime > word.endTime;
                          const chordForThisWord = getChordActiveAtTime(word.startTime, chords);
                          let shouldDisplayChordSymbol = false;

                          if (chordForThisWord && !renderedChordObjectsThisPass.has(chordForThisWord)) {
                            shouldDisplayChordSymbol = true;
                            renderedChordObjectsThisPass.add(chordForThisWord);
                          }
                          
                          const isChordSymbolActive = activeSongChord && chordForThisWord === activeSongChord;
                          const isChordSymbolPast = !isChordSymbolActive && chordForThisWord && chordForThisWord.endTime < currentTime;
                          const isChordSymbolUpcoming = !isChordSymbolActive && !isChordSymbolPast && chordForThisWord;

                          let wordTextStyle = '';
                          if (isThisTheCurrentSingingWord) {
                            wordTextStyle = 'text-accent font-bold bg-accent-lightBg rounded-sm';
                          } else if (isWordPast) {
                            wordTextStyle = 'text-muted-foreground';
                          } else if (isCurrentLineActive) { // Upcoming word in the active line
                            wordTextStyle = 'text-primary';
                          } else { // Upcoming word in an inactive line or before first lyric in song
                             // If this is the very first line and before any lyric is active, color it blue
                            const isFirstLyricLineOfSong = sectionIndex === 0 && lineIdx === 0 && lyrics[0] === line;
                            if (isFirstLyricLineOfSong && !activeLyricWordInfo && currentTime < word.startTime) {
                                wordTextStyle = 'text-primary';
                            } else {
                                wordTextStyle = 'text-foreground';
                            }
                          }

                          return (
                            <span
                              key={`word-${section.id}-${lineIdx}-${wordIndex}`}
                              className="relative inline-block" 
                            >
                              {shouldDisplayChordSymbol && chordForThisWord && (
                                <span
                                  className={cn(
                                    "absolute bottom-full left-0 translate-y-[5px] text-xs sm:text-sm font-semibold leading-none p-1 rounded-md",
                                    isChordSymbolActive 
                                      ? "bg-accent-lightBg text-accent font-bold" 
                                      : isChordSymbolPast
                                      ? "text-muted-foreground bg-muted/10"
                                      : isChordSymbolUpcoming
                                      ? "text-primary"
                                      : "text-primary"
                                  )}
                                >
                                  {chordForThisWord.chord}
                                </span>
                              )}
                              <span
                                className={cn(
                                  'leading-snug', // Removed transition-colors duration-100
                                  wordTextStyle
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
                })
              ) : (
                <div className="flex flex-wrap gap-x-3 gap-y-1 my-2">
                  {chords.map((chord, chordIdx) => {
                    if (chord.startTime >= section.startTime && chord.startTime < section.endTime && !renderedChordObjectsThisPass.has(chord)) {
                      renderedChordObjectsThisPass.add(chord);
                      const isChordSymbolActive = activeSongChord === chord;
                      const isChordSymbolPast = !isChordSymbolActive && chord.endTime < currentTime;
                      const isChordSymbolUpcoming = !isChordSymbolActive && !isChordSymbolPast;

                      return (
                        <span
                          key={`section-chord-${section.id}-${chordIdx}`}
                          className={cn(
                            "text-sm font-semibold p-1 rounded-md",
                             isChordSymbolActive 
                              ? "bg-accent-lightBg text-accent font-bold" 
                              : isChordSymbolPast
                              ? "text-muted-foreground bg-muted/10"
                              : isChordSymbolUpcoming
                              ? "text-primary"
                              : "text-primary"
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
        <p className="text-muted-foreground px-4 pb-4">
          No lyrics or sections available for this song.
        </p>
      )}
    </div>
  );
}

