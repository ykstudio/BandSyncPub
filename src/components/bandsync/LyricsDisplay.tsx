
import type { LyricLine, LyricWord, ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  chords: ChordChange[];
}

const getChordAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

export function LyricsDisplay({ lyrics, currentTime, chords: allChords }: LyricsDisplayProps) {
  const overallCurrentChord = allChords.find(c => currentTime >= c.startTime && currentTime < c.endTime);

  return (
    <div
      className="p-4 space-y-1 text-lg md:text-xl bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto"
    >
      {lyrics.map((line, lineIndex) => {
        let lastDisplayedChordText: string | null = null; 

        return (
          <div key={lineIndex} className="mb-3">
            <p className="flex flex-wrap items-start gap-x-1.5">
              {line.map((word, wordIndex) => {
                const isActiveWord = currentTime >= word.startTime && currentTime < word.endTime;
                const activeChordForWord = getChordAtTime(word.startTime, allChords);
                let displayChordData: ChordChange | null = null;

                if (activeChordForWord) {
                  if (lastDisplayedChordText !== activeChordForWord.chord) {
                    displayChordData = activeChordForWord;
                    lastDisplayedChordText = activeChordForWord.chord;
                  }
                } else {
                  const isPreviousChordStillActive = lastDisplayedChordText && allChords.find(c => c.chord === lastDisplayedChordText && word.startTime < c.endTime);
                  if (!isPreviousChordStillActive) {
                     lastDisplayedChordText = null;
                  }
                }
                
                if (wordIndex === 0 && activeChordForWord && !displayChordData) {
                    displayChordData = activeChordForWord;
                    lastDisplayedChordText = activeChordForWord.chord;
                }

                const isChordOverallCurrent = displayChordData !== null && displayChordData === overallCurrentChord;

                return (
                  <span
                    key={wordIndex}
                    className="inline-flex flex-col items-start min-h-[3em]"
                  >
                    {displayChordData ? (
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-semibold leading-none h-[1.2em] mb-0.5",
                          isChordOverallCurrent ? "text-accent font-bold" : "text-primary"
                        )}
                      >
                        {displayChordData.chord}
                      </span>
                    ) : (
                      <span className="h-[1.2em] mb-0.5"></span>
                    )}
                    <span
                      className={cn(
                        'transition-colors duration-100',
                        isActiveWord ? 'text-accent font-bold' : 'text-foreground'
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
      })}
      {lyrics.length === 0 && (
        <p className="text-muted-foreground">
          No lyrics available for this song.
        </p>
      )}
    </div>
  );
}
