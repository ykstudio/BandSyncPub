
import type { ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChordsDisplayProps {
  chords: ChordChange[];
  currentTime: number;
  songBpm: number;
}

const calculateSlideAnimationDuration = (
  targetChord: ChordChange | null,
  songBpm: number
): string => {
  const pulseDuration = songBpm > 0 ? 60 / songBpm : 0.5;
  const minSlideDuration = pulseDuration * 0.5; // Min 0.5 beat for the slide
  const maxSlideDuration = pulseDuration * 2;   // Max 2 beats for the slide

  if (!targetChord) {
    return `${minSlideDuration.toFixed(2)}s`; // Default if no chord
  }

  const chordActualDuration = Math.max(0.1, targetChord.endTime - targetChord.startTime);
  
  const slideDuration = Math.max(minSlideDuration, Math.min(chordActualDuration, maxSlideDuration));
  return `${slideDuration.toFixed(2)}s`;
};

export function ChordsDisplay({ chords, currentTime, songBpm }: ChordsDisplayProps) {
  const currentChordIndex = chords.findIndex(c => currentTime >= c.startTime && currentTime < c.endTime);
  
  const currentChord = currentChordIndex !== -1 ? chords[currentChordIndex] : null;
  const previousChord = currentChordIndex > 0 ? chords[currentChordIndex - 1] : null;
  const nextChord = currentChordIndex !== -1 && currentChordIndex < chords.length - 1 ? chords[currentChordIndex + 1] : null;

  const pulseDuration = songBpm > 0 ? (60 / songBpm).toFixed(2) : "0.5"; // Beat duration as string

  const prevSlideDuration = calculateSlideAnimationDuration(previousChord, songBpm);
  const currentSlideDuration = calculateSlideAnimationDuration(currentChord, songBpm);
  const nextSlideDuration = calculateSlideAnimationDuration(nextChord, songBpm);

  const previousChordStyles: React.CSSProperties = previousChord ? {
    animationName: 'previousChordEnter',
    animationDuration: prevSlideDuration,
    animationIterationCount: '1',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  } : {};

  const currentChordStyles: React.CSSProperties = currentChord ? {
    animationName: 'metronome-pulse, currentChordEnter',
    animationDuration: `${pulseDuration}s, ${currentSlideDuration}`,
    animationIterationCount: 'infinite, 1',
    animationTimingFunction: 'ease-in-out, ease-out',
    animationFillMode: 'both',
  } : { // Styles for when currentChord is null (displaying "-")
    animationName: 'metronome-pulse', // Keep pulse for rhythm if desired, or remove
    animationDuration: `${pulseDuration}s`,
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
    animationFillMode: 'both',
    opacity: 0.7, // Mimic metronome pulse base opacity
  };
  
  const nextChordStyles: React.CSSProperties = nextChord ? {
    animationName: 'nextChordEnter',
    animationDuration: nextSlideDuration,
    animationIterationCount: '1',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  } : {};

  return (
    <div className="p-4 bg-card rounded-lg shadow-md flex flex-col items-center justify-center h-48 md:h-96 overflow-hidden">
      <div className="flex items-end justify-center space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8 w-full">
        <div className="w-1/4 flex justify-end">
          {previousChord && (
            <div 
              key={`prev-${previousChord.startTime}`}
              className="text-4xl sm:text-5xl md:text-7xl leading-none text-muted-foreground opacity-75 transform translate-y-1"
              style={previousChordStyles}
            >
              {previousChord.chord}
            </div>
          )}
        </div>
        
        <div className="w-1/2 flex justify-center">
          {currentChord ? (
            <div 
              key={`current-${currentChord.startTime}`}
              className={cn(
                "text-6xl sm:text-8xl md:text-[10rem] font-bold text-accent leading-none"
              )} 
              style={currentChordStyles}
            >
              {currentChord.chord}
            </div>
          ) : (
            <div 
              key="current-null"
              className="text-2xl md:text-4xl text-muted-foreground leading-none"
              style={currentChordStyles} // Apply base style for "-" if needed
            >
              -
            </div>
          )}
        </div>

        <div className="w-1/4 flex justify-start">
          {nextChord && (
            <div 
              key={`next-${nextChord.startTime}`}
              className="text-7xl sm:text-9xl md:text-[12rem] text-primary leading-none"
              style={nextChordStyles}
            >
              {nextChord.chord}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
