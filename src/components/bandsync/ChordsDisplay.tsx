
import type { ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChordsDisplayProps {
  chords: ChordChange[];
  currentTime: number;
}

export function ChordsDisplay({ chords, currentTime }: ChordsDisplayProps) {
  const currentChordIndex = chords.findIndex(c => currentTime >= c.startTime && currentTime < c.endTime);
  
  const currentChord = currentChordIndex !== -1 ? chords[currentChordIndex] : null;
  const previousChord = currentChordIndex > 0 ? chords[currentChordIndex - 1] : null;
  const nextChord = currentChordIndex !== -1 && currentChordIndex < chords.length - 1 ? chords[currentChordIndex + 1] : null;

  return (
    <div className="p-4 bg-card rounded-lg shadow-md flex flex-col items-center justify-center h-48 md:h-96">
      <div className="flex items-end justify-center space-x-4 md:space-x-6 lg:space-x-8 w-full">
        <div className="w-1/4 flex justify-end">
          {previousChord && (
            <div className="text-2xl sm:text-3xl md:text-5xl text-muted-foreground opacity-75 transform translate-y-1">
              {previousChord.chord}
            </div>
          )}
        </div>
        
        <div className="w-1/2 flex justify-center">
          {currentChord ? (
            <div className="text-5xl sm:text-6xl md:text-8xl text-primary animate-metronome-pulse" style={{ animationDuration: '1.5s'}}>
              {currentChord.chord}
            </div>
          ) : (
            <div className="text-2xl md:text-4xl text-muted-foreground">
              -
            </div>
          )}
        </div>

        <div className="w-1/4 flex justify-start">
          {nextChord && (
            <div className="text-6xl sm:text-7xl md:text-9xl font-bold text-accent">
              {nextChord.chord}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
