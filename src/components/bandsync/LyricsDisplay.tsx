
import type { ChordChange, LyricLine, LyricWord } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  chords: ChordChange[];
}

// Helper to find the chord active at a specific time
const getChordActiveAtTime = (time: number, allChords: ChordChange[]): ChordChange | undefined => {
  return allChords.find(c => time >= c.startTime && time < c.endTime);
};

export function LyricsDisplay({ lyrics, currentTime, chords }: LyricsDisplayProps) {
  // Determine the chord that is currently active for the whole song (matches ChordsDisplay)
  const overallCurrentChord = getChordActiveAtTime(currentTime, chords);

  return (
    <div
      className="p-4 space-y-1 text-lg md:text-xl bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto"
    >
      {lyrics.map((line, lineIndex) => {
        // Tracks the text of the last chord displayed *on this line* to avoid redundancy.
        let lastChordTextDisplayedOnLine: string | null = null;

        return (
          <div key={lineIndex} className="mb-3"> {/* Use div for block layout of lines */}
            <p className="flex flex-wrap items-baseline gap-x-1.5"> {/* P for semantic line, flex for words */}
              {line.map((word, wordIndex) => {
                const isActiveWord = currentTime >= word.startTime && currentTime < word.endTime;

                // Determine the chord that should be associated with this specific word's timing.
                const chordAssociatedWithWord = getChordActiveAtTime(word.startTime, chords);
                
                let chordToDisplayAboveWord: ChordChange | null = null;

                if (chordAssociatedWithWord) {
                  // Display the chord if it's different from the last one shown on this line,
                  // or if it's the first word of the line (to ensure a chord is shown if active).
                  if (wordIndex === 0 || lastChordTextDisplayedOnLine !== chordAssociatedWithWord.chord) {
                    chordToDisplayAboveWord = chordAssociatedWithWord;
                    lastChordTextDisplayedOnLine = chordAssociatedWithWord.chord;
                  }
                } else {
                  // If no chord is active at this word's start time, ensure we reset tracker
                  // so a new chord can be shown for the next word if one starts.
                  // This handles cases where a word might fall in a gap between defined chords.
                  lastChordTextDisplayedOnLine = null;
                }

                // Check if the chord displayed above this word is the *overall* current chord for highlighting.
                // Compare by chord text and start time to ensure it's the exact same chord segment.
                const isThisDisplayedChordTheOverallCurrent = 
                  chordToDisplayAboveWord !== null &&
                  overallCurrentChord !== undefined &&
                  chordToDisplayAboveWord.chord === overallCurrentChord.chord &&
                  chordToDisplayAboveWord.startTime === overallCurrentChord.startTime;

                return (
                  <span
                    key={wordIndex}
                    className="relative inline-block pt-5" // Padding-top to make space for absolutely positioned chord
                  >
                    {chordToDisplayAboveWord && (
                      <span
                        className={cn(
                          "absolute bottom-full left-0 mb-0.5 text-xs sm:text-sm font-semibold leading-none",
                          isThisDisplayedChordTheOverallCurrent ? "text-accent font-bold" : "text-primary"
                        )}
                      >
                        {chordToDisplayAboveWord.chord}
                      </span>
                    )}
                    <span
                      className={cn(
                        'transition-colors duration-100 leading-snug', // ensure words themselves are aligned
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
