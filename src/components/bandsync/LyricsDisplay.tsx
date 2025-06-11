
'use client';

import type { ChordChange, LyricLine, LyricWord, SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useMemo } from 'react';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  chords: ChordChange[];
  sections: SongSection[];
  activeSongChord: ChordChange | undefined;
  activeLyricWordInfo: { word: LyricWord } | null; // Simplified, only need the word object
}

const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

export function LyricsDisplay({ lyrics, chords, sections, activeSongChord, activeLyricWordInfo }: LyricsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // This set tracks ChordChange objects that have had their symbol rendered in THIS pass.
  // It's memoized with dependencies on primary data to re-initialize if data fundamentally changes.
  // Cleared on each render pass to ensure fresh decisions.
  const renderedChordObjectsThisPass = useMemo(() => new Set<ChordChange>(), [lyrics, chords, sections]);
  renderedChordObjectsThisPass.clear();


  useEffect(() => {
    if (!scrollContainerRef.current || !activeLyricWordInfo?.word) return;

    // Construct a unique ID for the active word to scroll to it
    // This requires words to have stable IDs or a way to find them
    // For simplicity, we'll assume a naming convention or use a more robust lookup if needed.
    // Let's use a simpler selector for now, assuming active word has a unique class or attribute.
    // However, direct ID is better. Let's assume an ID like `word-${word.startTime}-${word.text}` could be formed
    // if words were guaranteed unique by startTime & text. For now, scrolling might be approximate.
    // The previous ID `word-${activeLyricWordInfo.lineIndex}-${activeLyricWordInfo.wordIndex}` won't work with new structure.

    // Attempt to find the element. This part might need refinement based on how words are uniquely identified in the DOM.
    // A robust way is to assign unique IDs to each word span if they don't have one.
    // For now, this effect might not scroll perfectly without unique word IDs.
    // We will rely on section-based scrolling or improve word IDing later if needed.

  }, [activeLyricWordInfo]);


  return (
    <div
      ref={scrollContainerRef}
      className="p-4 space-y-1 text-lg md:text-xl bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto scroll-smooth"
    >
      {sections.map((section, sectionIndex) => {
        // Find lyric lines that belong to this section
        const lyricLinesInSection = lyrics.filter(line => {
          if (line.length === 0) return false;
          const firstWordTime = line[0].startTime;
          // A line belongs to a section if its first word starts within or at the section's start,
          // and before the section ends.
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
            
            {lyricLinesInSection.length > 0 ? (
              lyricLinesInSection.map((line, lineIdx) => (
                <div key={`line-${section.id}-${lineIdx}`} className="mb-6">
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
                          // Consider adding a more robust ID for scrolling if needed: id={`word-t${word.startTime}`}
                          className="relative inline-block pt-px" 
                        >
                          {shouldDisplayChordSymbol && chordForThisWord && (
                            <span
                              className={cn(
                                "absolute bottom-full left-0 translate-y-[5px] text-xs sm:text-sm font-semibold leading-none",
                                highlightThisDisplayedChordSymbol ? "text-accent font-bold" : "text-primary"
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
              // Section has no lyrics, display chords for this section if not already rendered by a previous lyrical part
              <div className="flex flex-wrap gap-x-3 gap-y-1 my-2 px-1">
                {chords.map((chord, chordIdx) => {
                  // Display chord if it starts in this section AND hasn't been rendered yet in this pass
                  if (chord.startTime >= section.startTime && chord.startTime < section.endTime && !renderedChordObjectsThisPass.has(chord)) {
                    renderedChordObjectsThisPass.add(chord);
                    const isChordActive = activeSongChord === chord;
                    return (
                      <span
                        key={`section-chord-${section.id}-${chordIdx}`}
                        className={cn(
                          "text-sm font-semibold p-1 rounded",
                          isChordActive ? "text-accent font-bold bg-accent/10" : "text-primary bg-primary/10"
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
