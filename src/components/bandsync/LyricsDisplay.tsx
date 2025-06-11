
'use client';

import type { ChordChange, LyricLine, LyricWord, SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useMemo, useState } from 'react';

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
  currentSectionId: string | null;
  activeLineKeyForHighlight: string | null; // Derived from activeLyricWordInfo in JamPlayer
  songIsPlaying: boolean; // To help with initial scroll
}

const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

const LYRIC_LINE_RELEVANCE_BUFFER = 0.2; // 200ms buffer for keeping a line "blue"

export function LyricsDisplay({
  lyrics,
  chords,
  sections,
  currentTime,
  activeSongChord,
  activeLyricWordInfo,
  currentSectionId,
  activeLineKeyForHighlight,
  songIsPlaying
}: LyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionHeaderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevCurrentSectionIdRef = useRef<string | null>(null);
  const initialScrollDoneRef = useRef(false);

  const [lastTrackedActiveLineKey, setLastTrackedActiveLineKey] = useState<string | null>(null);

  useEffect(() => {
    if (activeLineKeyForHighlight) {
      setLastTrackedActiveLineKey(activeLineKeyForHighlight);
    }
  }, [activeLineKeyForHighlight]);


  const renderedChordObjectsThisPass = useMemo(() => new Set<ChordChange>(), [lyrics, chords, sections, activeSongChord, activeLyricWordInfo, currentTime, currentSectionId, activeLineKeyForHighlight]);
  renderedChordObjectsThisPass.clear();

  const { scrollTargetLineKey, scrollTargetIsSectionHeader } = useMemo(() => {
    let targetScrollKey: string | null = null;
    let isSectionHeader = false;

    if (activeLyricWordInfo) {
        const currentLineKey = `${activeLyricWordInfo.sectionId}_${activeLyricWordInfo.lineIndexWithinSection}`;
        const currentSectionIdxInAllSections = sections.findIndex(s => s.id === activeLyricWordInfo.sectionId);
        
        if (currentSectionIdxInAllSections !== -1) {
            const linesFilteredForCurrentSection = lyrics.filter(line => {
                if (line.length === 0) return false;
                const firstWordTime = line[0].startTime;
                return firstWordTime >= sections[currentSectionIdxInAllSections].startTime && firstWordTime < sections[currentSectionIdxInAllSections].endTime;
            });

            // Try to target the line *after* the current active line for scrolling
            if (activeLyricWordInfo.lineIndexWithinSection + 1 < linesFilteredForCurrentSection.length) {
                targetScrollKey = `${activeLyricWordInfo.sectionId}_${activeLyricWordInfo.lineIndexWithinSection + 1}`;
            } else { // If it's the last line of the current section, target the next section's first line or header
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
                    } else { // If next section has no lyrics, target its header
                        targetScrollKey = nextOverallSection.id;
                        isSectionHeader = true;
                        break;
                    }
                }
                if (!targetScrollKey && activeLineKeyForHighlight) { // If end of song, keep current active line in view
                    targetScrollKey = activeLineKeyForHighlight;
                }
            }
        }
    }

    // If no active lyric, find the earliest upcoming line based on currentTime
    if (!targetScrollKey) {
        let earliestNextTime = Infinity;
        let candidateKey: string | null = null;
        let candidateIsHeader = false;

        for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
            const section = sections[sectionIndex];
            if (section.startTime >= currentTime && section.startTime < earliestNextTime) {
                 // Check if this section is closer than any lyric line found so far
                const sectionIsCloser = !candidateKey || section.startTime < earliestNextTime;
                if (sectionIsCloser) {
                    earliestNextTime = section.startTime;
                    candidateKey = section.id; // Target section header
                    candidateIsHeader = true;
                }
            }
            
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
                        candidateIsHeader = false;
                    }
                }
            });
        }
        if (candidateKey) {
            targetScrollKey = candidateKey;
            isSectionHeader = candidateIsHeader;
        }
    }
    
    if (!targetScrollKey && lyrics.length > 0 && lyrics[0].length > 0 && currentTime < lyrics[0][0].startTime) {
      const firstSection = sections.find(s => lyrics[0][0].startTime >= s.startTime && lyrics[0][0].startTime < s.endTime);
      if (firstSection) {
        const linesInFirstSection = lyrics.filter(line => line.length > 0 && line[0].startTime >= firstSection.startTime && line[0].startTime < firstSection.endTime);
        if (linesInFirstSection.length > 0 && linesInFirstSection[0] === lyrics[0]) {
            targetScrollKey = `${firstSection.id}_0`;
            isSectionHeader = false;
        }
      }
    }
    return { scrollTargetLineKey: targetScrollKey, scrollTargetIsSectionHeader: isSectionHeader };
  }, [lyrics, sections, currentTime, activeLyricWordInfo, activeLineKeyForHighlight]);


  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    let elementToScrollTo: HTMLElement | null = null;

    if (scrollTargetLineKey) {
      if (scrollTargetIsSectionHeader) {
        elementToScrollTo = sectionHeaderRefs.current[scrollTargetLineKey];
      } else {
        elementToScrollTo = lineItemRefs.current[scrollTargetLineKey];
      }
    } else if (activeLineKeyForHighlight) { // Fallback to current active line if no specific scroll target
        elementToScrollTo = lineItemRefs.current[activeLineKeyForHighlight];
    }


    if (elementToScrollTo) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const elementRect = elementToScrollTo.getBoundingClientRect();
        
        const elementTopRelativeToContainer = elementRect.top - containerRect.top;
        const elementBottomRelativeToContainer = elementRect.bottom - containerRect.top;

        const isElementVisible = elementTopRelativeToContainer >= 0 && elementBottomRelativeToContainer <= containerRect.height;
        const isElementAbove = elementRect.top < containerRect.top;
        const isElementBelow = elementRect.bottom > containerRect.bottom;
        
        // Scroll if the element is not fully visible, or if it's a header and not at the top.
        // More aggressive scroll for active line if it's slightly off-center.
        let shouldScroll = false;
        if (scrollTargetIsSectionHeader && (isElementAbove || elementTopRelativeToContainer > 5)) { // Section headers always to top
            shouldScroll = true;
        } else if (!isElementVisible) {
            shouldScroll = true;
        } else if (lineItemRefs.current[activeLineKeyForHighlight!] === elementToScrollTo) { // Current active line
             // If active line is more than 1/3 down or above the top, scroll it nearer to top.
            if(elementTopRelativeToContainer < 0 || elementTopRelativeToContainer > containerRect.height / 3) {
                shouldScroll = true;
            }
        }


        if (shouldScroll || (!initialScrollDoneRef.current && songIsPlaying) ) {
             elementToScrollTo.scrollIntoView({ 
                behavior: (initialScrollDoneRef.current && songIsPlaying) ? 'auto' : 'auto', // was 'smooth'
                block: (scrollTargetIsSectionHeader || lineItemRefs.current[activeLineKeyForHighlight!] === elementToScrollTo) ? 'start' : 'nearest', // active line & headers to top
                inline: 'nearest' 
            });
            if (!initialScrollDoneRef.current && songIsPlaying) initialScrollDoneRef.current = true;
        }
    }

    if (currentSectionId !== prevCurrentSectionIdRef.current) {
      prevCurrentSectionIdRef.current = currentSectionId;
    }
  }, [scrollTargetLineKey, scrollTargetIsSectionHeader, activeLineKeyForHighlight, currentSectionId, currentTime, songIsPlaying]);


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
            
            <div className="px-4 pt-2 pb-1"> {/* Reduced pt from pt-16 to pt-2 */}
              {lyricLinesInSection.length > 0 ? (
                lyricLinesInSection.map((line, lineIdx) => {
                  const lineKey = `${section.id}_${lineIdx}`;
                  
                  return (
                    <div
                      key={`line-${section.id}-${lineIdx}`}
                      ref={el => lineItemRefs.current[lineKey] = el}
                      className="mb-6" // Increased mb from 2 to 6
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
                          const currentLineIsOfficiallyActive = activeLineKeyForHighlight === lineKey;

                          if (isThisTheCurrentSingingWord) {
                            wordTextStyle = 'text-accent font-bold bg-accent-lightBg rounded-sm px-0.5';
                          } else if (isWordPast) {
                            wordTextStyle = 'text-muted-foreground';
                          } else { // Upcoming word
                            let makeBlue = false;
                            if (currentLineIsOfficiallyActive) {
                              makeBlue = true;
                            } else if (!activeLineKeyForHighlight && lastTrackedActiveLineKey === lineKey) {
                              // activeLyricWordInfo is null, but this line was the last one known to be active.
                              if (line.length > 0) {
                                const lineActualEndTime = line[line.length - 1].endTime;
                                // Keep it blue if current time is still within this line's actual end + buffer
                                if (currentTime < lineActualEndTime + LYRIC_LINE_RELEVANCE_BUFFER) {
                                  makeBlue = true;
                                }
                              }
                            }

                            // Special handling for the very first line of the song
                            if (!makeBlue && sectionIndex === 0 && lineIdx === 0 && lyrics[0] === line && currentTime < (line.length > 0 ? line[0].startTime : 0) ) {
                              makeBlue = true;
                            }
                            wordTextStyle = makeBlue ? 'text-primary' : 'text-foreground';
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
                                  'leading-snug',
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
