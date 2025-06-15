
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
  activeLineKeyForHighlight: string |null;
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
    if (!scrollContainerRef.current || (!lyrics.length && !sections.length)) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    let elementToScroll: HTMLElement | null = null;
    
    if (activeLineKeyForHighlight && lineItemRefs.current[activeLineKeyForHighlight]) {
      elementToScroll = lineItemRefs.current[activeLineKeyForHighlight];
    } else if (currentSectionId && sectionHeaderRefs.current[currentSectionId]) {
      elementToScroll = sectionHeaderRefs.current[currentSectionId];
    } else if (lyrics.length > 0 && sections.length > 0 && sections[0].id) {
      const firstSectionId = sections[0].id;
      const firstLineKey = `${firstSectionId}_0`; // Assuming line index 0 for the first line of the first section
      if (lineItemRefs.current[firstLineKey]) {
        elementToScroll = lineItemRefs.current[firstLineKey];
      } else if (sectionHeaderRefs.current[firstSectionId]) {
        elementToScroll = sectionHeaderRefs.current[firstSectionId];
      }
    }

    if (!elementToScroll) return;
    
    if (songIsPlaying && !initialScrollDoneRef.current) {
      elementToScroll.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
      initialScrollDoneRef.current = true;
      return; 
    }
    
    if (songIsPlaying && elementToScroll) {
      const elementRect = elementToScroll.getBoundingClientRect();
      const topOffset = elementRect.top - containerRect.top;

      if (activeLineKeyForHighlight && lineItemRefs.current[activeLineKeyForHighlight]) { // Scrolling a lyric line
        // If line is out of view at the top OR too far down
        if (topOffset < 0 || topOffset > containerRect.height * 0.15) { 
           elementToScroll.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
        }
      } else if (currentSectionId && sectionHeaderRefs.current[currentSectionId] && elementToScroll === sectionHeaderRefs.current[currentSectionId]) { // Scrolling a section header
         // If header is not near the top (allowing for small discrepancies)
        if (Math.abs(topOffset) > 5) { // Check if it's more than 5px away from the top (after scroll-padding)
           elementToScroll.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
        }
      }
    }
  }, [activeLineKeyForHighlight, currentSectionId, songIsPlaying, lyrics, sections]);


  return (
    <div
      ref={scrollContainerRef}
      className="space-y-1 text-lg md:text-xl bg-white text-neutral-800 rounded-lg shadow-md h-64 md:h-[32rem] overflow-y-scroll border border-border scroll-pt-20"
    >
      {sections.map((section, sectionIndex) => {
        const lyricLinesInSection = lyrics.filter(line => {
          if (line.length === 0) return false;
          const firstWordTime = line[0].startTime;
          // Ensure firstWordTime is a number; it might be undefined if line is empty or malformed
          return typeof firstWordTime === 'number' && firstWordTime >= section.startTime && firstWordTime < section.endTime;
        });

        const isActiveSection = section.id === currentSectionId;

        return (
          <div key={`section-${section.id}-${sectionIndex}`} className="mb-3">
            <h3
              ref={el => sectionHeaderRefs.current[section.id] = el}
              className={cn(
                "text-base sm:text-lg font-semibold sticky top-0 py-2 z-10 border-b border-neutral-300 pl-4",
                isActiveSection 
                  ? "text-accent font-bold bg-accent-lightBg" 
                  : "text-primary bg-neutral-100" 
              )}
              id={`section-header-${section.id}`}
            >
              {section.name}
            </h3>
            
            <div className="px-4 pt-10 pb-1">
              {lyricLinesInSection.length > 0 ? (
                lyricLinesInSection.map((line, lineIdxInSection) => { 
                  const lineKey = `${section.id}_${lineIdxInSection}`;
                  
                  const isThisLineCurrentlySinging = activeLineKeyForHighlight === lineKey;
                  
                  let isLineActiveForStyling = isThisLineCurrentlySinging;
                  if (!isLineActiveForStyling && line.length > 0) {
                     const lineStartTime = line[0].startTime;
                     const lineEndTime = line[line.length-1].endTime;
                     if (lastTrackedActiveLineKey === lineKey && currentTime >= lineStartTime && currentTime < (lineEndTime + LYRIC_LINE_RELEVANCE_BUFFER)) {
                       isLineActiveForStyling = true;
                     }
                  }
                  
                  if (!songIsPlaying && !activeLineKeyForHighlight && sectionIndex === 0 && lineIdxInSection === 0 && currentTime < (line[0]?.startTime ?? 0)) {
                    isLineActiveForStyling = true;
                  }

                  return (
                    <div
                      key={lineKey}
                      ref={el => lineItemRefs.current[lineKey] = el}
                      className="mb-6" 
                      id={`line-item-${lineKey}`}
                    >
                      <p className="flex flex-wrap items-baseline gap-x-1.5">
                        {line.map((word, wordIndex) => {
                          const isThisTheCurrentSingingWord = activeLyricWordInfo?.word.startTime === word.startTime && 
                                                              activeLyricWordInfo?.word.text === word.text && 
                                                              activeLyricWordInfo?.sectionId === section.id &&
                                                              activeLyricWordInfo?.lineIndexWithinSection === lineIdxInSection;

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

                          let wordTextStyle = 'text-neutral-800'; 

                          if (isThisTheCurrentSingingWord) {
                            wordTextStyle = 'text-primary-on-light bg-accent-lightBg rounded-sm'; 
                          } else if (isWordPast) {
                            wordTextStyle = 'text-neutral-500'; 
                          } else if (isLineActiveForStyling) {
                            wordTextStyle = 'text-primary-on-light'; 
                          }
                          
                          if (!songIsPlaying && sectionIndex === 0 && lineIdxInSection === 0 && currentTime < (line[0]?.startTime ?? 0) && !isWordPast && !isThisTheCurrentSingingWord) {
                            wordTextStyle = 'text-primary-on-light'; 
                          }
                          
                          return (
                            <span
                              key={`word-${section.id}-${lineIdxInSection}-${wordIndex}`}
                              className={cn(
                                "relative inline-block leading-snug",
                              )}
                            >
                              {shouldDisplayChordSymbol && chordForThisWord && (
                                <span
                                  className={cn(
                                    "absolute bottom-full left-0 translate-y-[5px] text-xs sm:text-sm font-semibold leading-none p-1 rounded-md",
                                    isChordSymbolActive 
                                      ? "bg-accent-lightBg font-bold" 
                                      : isChordSymbolPast
                                      ? "text-neutral-500 bg-neutral-100" 
                                      : isChordSymbolUpcoming 
                                      ? "text-primary-on-light" 
                                      : "text-primary-on-light"
                                  )}
                                  style={isChordSymbolActive ? { color: 'hsl(var(--current-chord-text))' } : {}}
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
                              ? "bg-accent-lightBg font-bold" 
                              : isChordSymbolPast
                              ? "text-neutral-500 bg-neutral-100" 
                              : isChordSymbolUpcoming 
                              ? "text-primary-on-light" 
                              : "text-primary-on-light" 
                          )}
                          style={isChordSymbolActive ? { color: 'hsl(var(--current-chord-text))' } : {}}
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
        <p className="text-neutral-600 px-4 pb-4"> 
          No lyrics or sections available for this song.
        </p>
      )}
    </div>
  );
}

