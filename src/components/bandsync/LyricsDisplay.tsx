
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
            // Get all lines that belong to the current active section, maintaining their order as they appear in the original lyrics array.
            // Their index within this filtered list is what activeLyricWordInfo.lineIndexWithinSection refers to.
            const linesFilteredForCurrentSection = lyrics.filter(line => {
                if (line.length === 0) return false;
                const firstWordTime = line[0].startTime;
                return firstWordTime >= sections[currentSectionIdxInAllSections].startTime && firstWordTime < sections[currentSectionIdxInAllSections].endTime;
            });

            // Check for next line in the same section
            if (activeLyricWordInfo.lineIndexWithinSection + 1 < linesFilteredForCurrentSection.length) {
                targetScrollKey = `${activeLyricWordInfo.sectionId}_${activeLyricWordInfo.lineIndexWithinSection + 1}`;
            } else {
                // No more lines in current section, check for the first line in subsequent sections
                for (let i = currentSectionIdxInAllSections + 1; i < sections.length; i++) {
                    const nextOverallSection = sections[i];
                    const linesFilteredForNextOverallSection = lyrics.filter(line =>
                        line.length > 0 &&
                        line[0].startTime >= nextOverallSection.startTime &&
                        line[0].startTime < nextOverallSection.endTime
                    );
                    if (linesFilteredForNextOverallSection.length > 0) {
                        // The lineIndexWithinSection for the first line of any section is always 0
                        targetScrollKey = `${nextOverallSection.id}_0`; 
                        break;
                    }
                }
            }
        }
    }

    // If no target found yet (e.g., no active lyric, or end of all lyrics),
    // find the *absolute* next line based on currentTime to scroll to.
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

    return { activeLineKeyForHighlight: highlightKey, scrollTargetLineKey: targetScrollKey };
  }, [lyrics, sections, currentTime, activeLyricWordInfo]);


  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const isNewSectionJustActivated = currentSectionId !== null && prevCurrentSectionIdRef.current !== currentSectionId;

    let scrolledThisUpdate = false;

    if (isNewSectionJustActivated && currentSectionId) {
      const sectionHeaderElement = sectionHeaderRefs.current[currentSectionId];
      if (sectionHeaderElement) {
        sectionHeaderElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        scrolledThisUpdate = true;
      }
    } 
    
    if (!scrolledThisUpdate && scrollTargetLineKey) {
      const targetLineElement = lineItemRefs.current[scrollTargetLineKey];
      if (targetLineElement) {
        targetLineElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        scrolledThisUpdate = true;
      }
    }
    
    // Fallback if no specific scrollTargetLineKey but an active line exists (e.g. last line of song)
    if (!scrolledThisUpdate && activeLineKeyForHighlight && !isNewSectionJustActivated) {
      const activeLineElement = lineItemRefs.current[activeLineKeyForHighlight];
      if (activeLineElement) {
         // Check if the active line is mostly out of view before forcing a scroll
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const elementRect = activeLineElement.getBoundingClientRect();
        if (elementRect.bottom > containerRect.bottom - 20 || elementRect.top < containerRect.top + 20) {
            activeLineElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
        scrolledThisUpdate = true;
      }
    }
    
    // If no lyrics scrolled, and it's an instrumental section (not new)
    if (!scrolledThisUpdate && currentSectionId && !activeLyricWordInfo && !isNewSectionJustActivated) {
      const sectionHeaderElement = sectionHeaderRefs.current[currentSectionId];
      if (sectionHeaderElement) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const elementRect = sectionHeaderElement.getBoundingClientRect();
        if (elementRect.top > containerRect.top + 20) { 
            sectionHeaderElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
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
      className="space-y-1 text-lg md:text-xl bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto scroll-smooth border border-border"
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
                  const isCurrentActiveLine = activeLineKeyForHighlight === lineKey;
                  
                  return (
                    <div
                      key={`line-${section.id}-${lineIdx}`}
                      ref={el => lineItemRefs.current[lineKey] = el}
                      className="mb-6"
                    >
                      <p className={cn(
                        "flex flex-wrap items-baseline gap-x-1.5",
                        isCurrentActiveLine ? "text-primary" : "text-foreground"
                      )}>
                        {line.map((word, wordIndex) => {
                          const isThisTheCurrentActiveWord = activeLyricWordInfo?.word === word;
                          const chordForThisWord = getChordActiveAtTime(word.startTime, chords);
                          let shouldDisplayChordSymbol = false;

                          if (chordForThisWord && !renderedChordObjectsThisPass.has(chordForThisWord)) {
                            shouldDisplayChordSymbol = true;
                            renderedChordObjectsThisPass.add(chordForThisWord);
                          }
                          
                          const isChordSymbolActive = activeSongChord && chordForThisWord === activeSongChord;
                          const isChordSymbolPast = !isChordSymbolActive && chordForThisWord && chordForThisWord.endTime < currentTime;
                          const isChordSymbolUpcoming = !isChordSymbolActive && !isChordSymbolPast && chordForThisWord;

                          return (
                            <span
                              key={`word-${section.id}-${lineIdx}-${wordIndex}`}
                              className="relative inline-block pt-px" 
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
                                  'transition-colors duration-100 leading-snug',
                                  isThisTheCurrentActiveWord 
                                    ? 'text-accent font-bold bg-accent-lightBg rounded-sm' 
                                    : '' // Text color is inherited from parent <p>
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
