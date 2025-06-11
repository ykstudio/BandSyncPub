
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
  activeLineKeyForHighlight: string | null;
  songIsPlaying: boolean;
}

const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

const LYRIC_LINE_RELEVANCE_BUFFER = 0.2; // Keep line blue after last word

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
  
  const [lastTrackedActiveLineKey, setLastTrackedActiveLineKey] = useState<string | null>(null);
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    if (activeLineKeyForHighlight) {
      setLastTrackedActiveLineKey(activeLineKeyForHighlight);
    }
  }, [activeLineKeyForHighlight]);

  const renderedChordObjectsThisPass = useMemo(() => new Set<ChordChange>(), [lyrics, chords, sections, currentTime, activeSongChord, activeLyricWordInfo, currentSectionId, activeLineKeyForHighlight]);
  renderedChordObjectsThisPass.clear();


  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    let scrollTargetElement: HTMLElement | null = null;
    let scrollOptions: ScrollIntoViewOptions = { behavior: 'auto', inline: 'nearest', block: 'start' }; // Default to 'start'

    if (activeLineKeyForHighlight && lineItemRefs.current[activeLineKeyForHighlight]) {
        scrollTargetElement = lineItemRefs.current[activeLineKeyForHighlight];
    } else if (currentSectionId && sectionHeaderRefs.current[currentSectionId]) {
        scrollTargetElement = sectionHeaderRefs.current[currentSectionId];
    }

    // Initial scroll logic: if playback just started and we haven't done an initial scroll.
    if (!initialScrollDoneRef.current && songIsPlaying && !scrollTargetElement) {
        if (sections.length > 0) {
            const firstSectionId = sections[0].id;
            const firstLineKey = `${firstSectionId}_0`; // Try to target the first lyric line
            if (lineItemRefs.current[firstLineKey]) {
                scrollTargetElement = lineItemRefs.current[firstLineKey];
            } else if (sectionHeaderRefs.current[firstSectionId]) { // Fallback to first section header
                scrollTargetElement = sectionHeaderRefs.current[firstSectionId];
            }
        }
    }
    
    if (scrollTargetElement) {
        const elementRect = scrollTargetElement.getBoundingClientRect();
        const topOffset = elementRect.top - containerRect.top;
        const isTargetActiveLine = activeLineKeyForHighlight && scrollTargetElement === lineItemRefs.current[activeLineKeyForHighlight];

        let shouldScroll = false;

        if (isTargetActiveLine) {
            // If the active line is not roughly in the top 0-30% of the viewport, scroll it.
            if (topOffset < 0 || topOffset > containerRect.height * 0.3) {
                shouldScroll = true;
            }
        } else if (scrollTargetElement.id.startsWith('section-header-')) { // Is a section header
             // If section header isn't very close to the top, scroll it.
            if (Math.abs(topOffset) > 5) { // 5px tolerance
                shouldScroll = true;
            }
        } else if (!initialScrollDoneRef.current && songIsPlaying) { // For initial scroll
            shouldScroll = true;
        }


        if (shouldScroll) {
            scrollTargetElement.scrollIntoView(scrollOptions);
            if (!initialScrollDoneRef.current && songIsPlaying && scrollTargetElement) {
                initialScrollDoneRef.current = true;
            }
        }
    }
}, [activeLineKeyForHighlight, currentSectionId, songIsPlaying, sections, lyrics, initialScrollDoneRef]); // Simplified dependencies


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
              id={`section-header-${section.id}`} // Added ID for easier targeting if needed
            >
              {section.name}
            </h3>
            
            <div className="px-4 pt-2 pb-1">
              {lyricLinesInSection.length > 0 ? (
                lyricLinesInSection.map((line, lineIdxInSection) => { 
                  const lineKey = `${section.id}_${lineIdxInSection}`;
                  
                  const isThisLineCurrentlySinging = activeLineKeyForHighlight === lineKey;
                  const wasThisLineLastSinging = lastTrackedActiveLineKey === lineKey;
                  const isLineActiveForStyling = isThisLineCurrentlySinging || 
                                                (activeLineKeyForHighlight === null && 
                                                 wasThisLineLastSinging && 
                                                 line.length > 0 && 
                                                 currentTime < (line[line.length-1].endTime + LYRIC_LINE_RELEVANCE_BUFFER));

                  return (
                    <div
                      key={lineKey}
                      ref={el => lineItemRefs.current[lineKey] = el}
                      className="mb-6" 
                    >
                      <p className="flex flex-wrap items-baseline gap-x-1.5">
                        {line.map((word, wordIndex) => {
                          const isThisTheCurrentSingingWord = activeLyricWordInfo?.word.startTime === word.startTime && activeLyricWordInfo?.word.text === word.text && activeLyricWordInfo?.sectionId === section.id;
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
                            wordTextStyle = 'text-accent bg-accent-lightBg rounded-sm';
                          } else if (isWordPast) {
                            wordTextStyle = 'text-muted-foreground';
                          } else { 
                            if (isLineActiveForStyling) {
                                wordTextStyle = 'text-primary';
                            } else {
                                wordTextStyle = 'text-foreground';
                            }
                          }
                          
                          if (!songIsPlaying && sectionIndex === 0 && lineIdxInSection === 0 && currentTime < (line[0]?.startTime ?? 0) && !isWordPast && !isThisTheCurrentSingingWord) {
                            wordTextStyle = 'text-primary';
                          }


                          return (
                            <span
                              key={`word-${section.id}-${lineIdxInSection}-${wordIndex}`}
                              className={cn(
                                "relative inline-block leading-snug", // Removed pt-px, removed transition-colors
                                wordTextStyle
                              )}
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
                              <span className={cn(wordTextStyle)}>
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
                  {chords.filter(c => c.startTime >= section.startTime && c.startTime < section.endTime)
                         .map((chord, chordIdx) => {
                    if (!renderedChordObjectsThisPass.has(chord)) {
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

