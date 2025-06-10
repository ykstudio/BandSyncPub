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
  return (
    <div className="p-4 space-y-1 text-lg md:text-xl leading-relaxed bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto">
      {lyrics.map((line, lineIndex) => {
        let lastDisplayedChordText: string | null = null; 

        return (
          <div key={lineIndex} className="mb-3"> {/* More compact line spacing */}
            <p className="flex flex-wrap items-start gap-x-1.5"> {/* Changed items-end to items-start */}
              {line.map((word, wordIndex) => {
                const isActive = currentTime >= word.startTime && currentTime < word.endTime;
                const activeChordForWord = getChordAtTime(word.startTime, allChords);
                let displayChord: string | null = null;

                if (activeChordForWord) {
                  if (lastDisplayedChordText !== activeChordForWord.chord) {
                    displayChord = activeChordForWord.chord;
                    lastDisplayedChordText = activeChordForWord.chord;
                  }
                } else {
                  // If no chord is active for this word's start time, ensure we don't carry over lastDisplayedChordText
                  // if the previous chord has ended.
                  const isPreviousChordStillActive = lastDisplayedChordText && allChords.find(c => c.chord === lastDisplayedChordText && word.startTime < c.endTime);
                  if (!isPreviousChordStillActive) {
                     lastDisplayedChordText = null;
                  }
                }
                
                // If it's the very first word of the line and no chord has been displayed yet for this line,
                // but a chord is active, ensure it's shown.
                if (wordIndex === 0 && activeChordForWord && !displayChord) {
                    displayChord = activeChordForWord.chord;
                    lastDisplayedChordText = activeChordForWord.chord;
                }


                return (
                  <span key={wordIndex} className="inline-flex flex-col items-start min-h-[2.5em]"> {/* Ensure space for chord */}
                    {displayChord && (
                      <span className="text-xs sm:text-sm font-semibold text-primary mb-0 leading-none h-[1.2em]"> {/* Adjusted size & spacing */}
                        {displayChord}
                      </span>
                    )}
                    {!displayChord && <span className="h-[1.2em]"></span>} {/* Placeholder for spacing if no chord */}
                    <span
                      className={cn(
                        'transition-colors duration-100',
                        isActive ? 'text-accent font-bold' : 'text-foreground'
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
      {lyrics.length === 0 && <p className="text-muted-foreground">No lyrics available for this song.</p>}
    </div>
  );
}
