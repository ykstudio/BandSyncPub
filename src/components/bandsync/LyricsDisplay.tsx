
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


  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const isNewSectionJustActivated = currentSectionId !== null && prevCurrentSectionIdRef.current !== currentSectionId;

    if (isNewSectionJustActivated) {
      const sectionHeaderElement = sectionHeaderRefs.current[currentSectionId!];
      if (sectionHeaderElement) {
        sectionHeaderElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }
    } else if (activeLyricWordInfo?.word) {
      // Not a new section, but an active lyric word exists
      const { sectionId, lineIndexWithinSection } = activeLyricWordInfo;
      const targetKey = `${sectionId}_${lineIndexWithinSection}`;
      const lyricLineElement = lineItemRefs.current[targetKey];
      if (lyricLineElement) {
        lyricLineElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    } else if (currentSectionId && !activeLyricWordInfo?.word && !isNewSectionJustActivated) {
      // Current section is active (e.g., instrumental part), no active lyrics, and it's not a brand new section activation.
      // The header should have been scrolled to 'start' when the section was new.
      // We could re-scroll to 'start' here if needed, but it might cause jitter if the user scrolled manually.
      // For now, primary scroll happens on new section activation or lyric change.
      // If solo section header is still not showing, this `else if` might need to be more assertive like the `isNewSectionJustActivated` block.
      const sectionHeaderElement = sectionHeaderRefs.current[currentSectionId!];
      if (sectionHeaderElement) {
         // Check if the element is already mostly visible at the top.
         // This is a heuristic to prevent jitter if it's already well-positioned.
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const elementRect = sectionHeaderElement.getBoundingClientRect();
        // If the top of the element is significantly below the top of the container, scroll it up.
        if (elementRect.top > containerRect.top + 20) { // 20px tolerance
            sectionHeaderElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
      }
    }

    // Update the previous section ID *after* all logic for the current render.
    if (currentSectionId !== prevCurrentSectionIdRef.current) {
      prevCurrentSectionIdRef.current = currentSectionId;
    }
  }, [activeLyricWordInfo, currentSectionId]);


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
                                  : 'text-foreground'
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
