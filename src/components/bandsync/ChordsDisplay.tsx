import type { ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChordsDisplayProps {
  chords: ChordChange[];
  currentTime: number;
}

export function ChordsDisplay({ chords, currentTime }: ChordsDisplayProps) {
  const currentChord = chords.find(c => currentTime >= c.startTime && currentTime < c.endTime);

  return (
    <div className="p-4 bg-card rounded-lg shadow-md flex flex-col items-center justify-center h-48 md:h-96">
      <p className="text-sm text-muted-foreground mb-2">Current Chord</p>
      {currentChord ? (
        <div className="text-5xl sm:text-6xl md:text-8xl font-bold text-accent">
          {currentChord.chord}
        </div>
      ) : (
        <div className="text-2xl md:text-4xl text-muted-foreground">
          -
        </div>
      )}
    </div>
  );
}
