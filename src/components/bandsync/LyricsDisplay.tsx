
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
    lineIndexWithinSection: number; // This is the index within the section's own lyric lines array
  } | null;
  currentSectionId: string | null; // The ID of the section current time falls into
  activeLineKeyForHighlight: string | null; // Derived from activeLyricWordInfo in JamPlayer: ${sectionId}_${lineIndexWithinSection}
  songIsPlaying: boolean; 
}

const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

const LYRIC_LINE_RELEVANCE_BUFFER = 0.2; // 200ms buffer for keeping a line "blue" after its last word.
const LYRIC_SCROLL_TARGET_OFFSET_LINES = 1; // How many lines ahead to target for scrolling (0 means current, 1 means next)

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

  const { scrollTargetKey, scrollTargetType } = useMemo(() => {
    let key: string | null = null;
    let type: 'line' | 'header' | null = null;

    if (activeLyricWordInfo && activeLyricWordInfo.sectionId && sections.find(s => s.id === activeLyricWordInfo.sectionId)) {
      const currentSecData = sections.find(s => s.id === activeLyricWordInfo.sectionId)!;
      const linesInCurrentSec = lyrics.filter(line =>
        line.length > 0 &&
        line[0].startTime >= currentSecData.startTime &&
        line[0].startTime < currentSecData.endTime
      );
      
      // activeLyricWordInfo.lineIndexWithinSection is already the index within linesInCurrentSec
      const currentLineIdxInSec = activeLyricWordInfo.lineIndexWithinSection;

      if (currentLineIdxInSec + LYRIC_SCROLL_TARGET_OFFSET_LINES < linesInCurrentSec.length) {
        key = `${activeLyricWordInfo.sectionId}_${currentLineIdxInSec + LYRIC_SCROLL_TARGET_OFFSET_LINES}`;
        type = 'line';
      } else { // End of current section's lyrics, or targeting beyond it
        const currentGlobalSectionIndex = sections.findIndex(s => s.id === activeLyricWordInfo.sectionId);
        if (currentGlobalSectionIndex + 1 < sections.length) {
          const nextSection = sections[currentGlobalSectionIndex + 1];
          const linesInNextSec = lyrics.filter(line =>
            line.length > 0 &&
            line[0].startTime >= nextSection.startTime &&
            line[0].startTime < nextSection.endTime
          );
          if (linesInNextSec.length > 0) {
            key = `${nextSection.id}_0`;
            type = 'line';
          } else {
            key = nextSection.id;
            type = 'header';
          }
        } else if (activeLineKeyForHighlight) { // At the very end of all lyrics
            key = activeLineKeyForHighlight;
            type = 'line';
        }
      }
    } else if (currentSectionId) {
      // No active lyric word, but we are in a section (e.g., instrumental, or gap between lyrics)
      key = currentSectionId;
      type = 'header';
    }

    // If still no key (e.g. before song starts), and before the very first lyric/section
    if (!key && sections.length > 0 && currentTime < (sections[0].startTime)) {
       const firstSection = sections[0];
       const linesInFirstSec = lyrics.filter(line =>
          line.length > 0 &&
          line[0].startTime >= firstSection.startTime &&
          line[0].startTime < firstSection.endTime
        );
        if (linesInFirstSec.length > 0) {
            key = `${firstSection.id}_0`; // Target first line of first section
            type = 'line';
        } else { // First section is instrumental
            key = firstSection.id;
            type = 'header';
        }
    }
    
    return { scrollTargetKey: key, scrollTargetType: type };
  }, [lyrics, sections, currentTime, activeLyricWordInfo, currentSectionId, activeLineKeyForHighlight]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    let elementToScrollTo: HTMLElement | null = null;

    if (scrollTargetKey) {
      if (scrollTargetType === 'header') {
        elementToScrollTo = sectionHeaderRefs.current[scrollTargetKey];
      } else if (scrollTargetType === 'line') {
        elementToScrollTo = lineItemRefs.current[scrollTargetKey];
      }
    } else if (activeLineKeyForHighlight) { 
        elementToScrollTo = lineItemRefs.current[activeLineKeyForHighlight];
    }

    if (elementToScrollTo) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const elementRect = elementToScrollTo.getBoundingClientRect();
        const elementTopRelativeToContainer = elementRect.top - containerRect.top;
        
        let shouldScroll = false;
        let scrollBehavior: ScrollBehavior = 'auto';
        let scrollBlockPosition: ScrollLogicalPosition = 'nearest';

        if (scrollTargetType === 'header') {
            scrollBlockPosition = 'start';
            // If the header is not already very close to the top, scroll it.
            if (Math.abs(elementTopRelativeToContainer) > 5) { 
                shouldScroll = true;
            }
        } else if (scrollTargetType === 'line') {
            const isActiveLineElement = lineItemRefs.current[activeLineKeyForHighlight!] === elementToScrollTo;
            if (isActiveLineElement) {
                // If current active line is out of top 1/3 view
                if (elementTopRelativeToContainer < 0 || elementTopRelativeToContainer > containerRect.height / 3) {
                    scrollBlockPosition = 'start'; // Consider 'center' or an offset if 'start' is too high
                    shouldScroll = true;
                }
            } else { // Upcoming line (not the currently active one)
                 // If upcoming line is not roughly in the middle to lower part of viewport
                if (elementTopRelativeToContainer < containerRect.height * 0.2 || elementTopRelativeToContainer > containerRect.height * 0.8) {
                    scrollBlockPosition = 'center'; 
                    shouldScroll = true;
                }
            }
        } else if (lineItemRefs.current[activeLineKeyForHighlight!] === elementToScrollTo && activeLineKeyForHighlight) {
            // Fallback for activeLineKeyForHighlight when no specific targetType
             if (elementTopRelativeToContainer < 0 || elementTopRelativeToContainer > containerRect.height / 3) {
                scrollBlockPosition = 'start';
                shouldScroll = true;
            }
        }

        if (shouldScroll || (!initialScrollDoneRef.current && songIsPlaying && scrollTargetKey)) {
             elementToScrollTo.scrollIntoView({ 
                behavior: scrollBehavior,
                block: scrollBlockPosition, 
                inline: 'nearest' 
            });
            if (!initialScrollDoneRef.current && songIsPlaying) initialScrollDoneRef.current = true;
        }
    }
  }, [scrollTargetKey, scrollTargetType, activeLineKeyForHighlight, songIsPlaying, currentTime, sections]);


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
            
            <div className="px-4 pt-2 pb-1">
              {lyricLinesInSection.length > 0 ? (
                lyricLinesInSection.map((line, lineIdxInSection) => { // lineIdxInSection is the index *within this section's lines*
                  const lineKey = `${section.id}_${lineIdxInSection}`;
                  
                  const isCurrentLineActiveForStyling = activeLineKeyForHighlight === lineKey || 
                                                        (!activeLineKeyForHighlight && 
                                                         lastTrackedActiveLineKey === lineKey && 
                                                         line.length > 0 && 
                                                         currentTime < (line[line.length-1].endTime + LYRIC_LINE_RELEVANCE_BUFFER)) ||
                                                        (!activeLineKeyForHighlight && !lastTrackedActiveLineKey && sectionIndex === 0 && lineIdxInSection === 0 && currentTime < (line[0]?.startTime ?? 0));

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
                          } else { // Upcoming word
                            if (isCurrentLineActiveForStyling) {
                                wordTextStyle = 'text-primary';
                            } else {
                                wordTextStyle = 'text-foreground';
                            }
                          }
                          
                          // Special handling for the very first line of the song to be blue before play starts
                          if (!isPlaying && sectionIndex === 0 && lineIdxInSection === 0 && currentTime < (line[0]?.startTime ?? 0) && !isWordPast && !isThisTheCurrentSingingWord) {
                            wordTextStyle = 'text-primary';
                          }


                          return (
                            <span
                              key={`word-${section.id}-${lineIdxInSection}-${wordIndex}`}
                              className="relative inline-block" // Removed pt-px
                            >
                              {shouldDisplayChordSymbol && chordForThisWord && (
                                <span
                                  className={cn(
                                    "absolute bottom-full left-0 translate-y-[5px] text-xs sm:text-sm font-semibold leading-none p-1 rounded-md",
                                    isChordSymbolActive 
                                      ? "bg-accent-lightBg text-accent font-bold" 
                                      : isChordSymbolPast
                                      ? "text-muted-foreground bg-muted/10"
                                      : isChordSymbolUpcoming // Default to primary for upcoming chords in lyrics
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
              ) : ( // No lyrics in this section, display chords if any
                <div className="flex flex-wrap gap-x-3 gap-y-1 my-2">
                  {chords.filter(c => c.startTime >= section.startTime && c.startTime < section.endTime)
                         .map((chord, chordIdx) => {
                    if (!renderedChordObjectsThisPass.has(chord)) {
                      renderedChordObjectsThisPass.add(chord);
                      const isChordSymbolActive = activeSongChord === chord;
                      const isChordSymbolPast = !isChordSymbolActive && chord.endTime < currentTime;
                      // Upcoming chords in instrumental sections could be primary or muted based on preference
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
                              ? "text-primary" // Or text-muted-foreground if preferred for instrumental upcoming
                              : "text-primary" // Default for chords that don't fit other categories
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
