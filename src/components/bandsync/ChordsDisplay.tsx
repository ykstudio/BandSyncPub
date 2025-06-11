
import type { ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChordsDisplayProps {
  chords: ChordChange[];
  currentTime: number;
  songBpm: number;
}

const calculateSlideAnimationDuration = (
  targetChord: ChordChange | null,
  songBpm: number,
  pulseDuration: number
): string => {
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
  const pulseDuration = songBpm > 0 ? 60 / songBpm : 0.5;
  const anticipationLeadTime = pulseDuration; // Look ahead one beat

  const targetDisplayTime = currentTime + anticipationLeadTime;

  let visuallyCurrentChordIndex = -1;
  if (chords.length > 0) {
    visuallyCurrentChordIndex = chords.findIndex(c => targetDisplayTime >= c.startTime && targetDisplayTime < c.endTime);
    
    // Handle edge case: if targetDisplayTime is before the first chord, but currentTime is also very early (or 0)
    // we might want to show the first chord as "current" visually if we are about to start it.
    if (visuallyCurrentChordIndex === -1 && targetDisplayTime < chords[0].startTime && chords[0].startTime - targetDisplayTime < pulseDuration * 1.5) {
        // If we are very close to the first chord's start (within 1.5 beats before its actual start after anticipation)
        // consider it the next one, and current is null.
    } else if (visuallyCurrentChordIndex === -1 && targetDisplayTime >= chords[chords.length -1].endTime) {
        // If targetDisplayTime is past the last chord, nothing is current visually.
    } else if (visuallyCurrentChordIndex === -1 && chords.length > 0 && targetDisplayTime < chords[0].startTime) {
        // If we are well before the first chord, then nothing is current yet.
        // This might mean visuallyCurrent is null, visuallyNext is the first chord.
    }


     // If targetDisplayTime is before the very first chord's startTime, treat the first chord as the "visually current" if we're close enough,
     // otherwise, no chord is visually current yet.
    if (visuallyCurrentChordIndex === -1 && chords.length > 0 && targetDisplayTime < chords[0].startTime) {
        // If current time + lead time is still before the first chord, it means no chord is "visually current" yet based on lookahead.
        // However, if currentTime itself is very close to 0 and before the first chord, we might want to show the first chord as 'next'.
        // This logic is tricky. Let's simplify: if findIndex is -1 and we are before the first chord, visuallyCurrent is null.
        // The "next" logic below will pick up the first chord if appropriate.
    }
  }


  const visuallyCurrentChord = visuallyCurrentChordIndex !== -1 ? chords[visuallyCurrentChordIndex] : null;
  
  const visuallyPreviousChord = visuallyCurrentChordIndex > 0 ? chords[visuallyCurrentChordIndex - 1] : 
                                (visuallyCurrentChordIndex === 0 && currentTime < (chords[0]?.startTime ?? Infinity) ? null : undefined); // undefined if no logical previous
  
  let visuallyNextChord: ChordChange | null = null;
  if (visuallyCurrentChordIndex !== -1 && visuallyCurrentChordIndex < chords.length - 1) {
    visuallyNextChord = chords[visuallyCurrentChordIndex + 1];
  } else if (visuallyCurrentChordIndex === -1 && chords.length > 0 && targetDisplayTime < chords[0].startTime) {
    // If no current chord is identified yet (because we are before the first chord even with anticipation),
    // then the "next" chord is the first chord of the song.
    visuallyNextChord = chords[0];
  }


  const prevSlideDuration = calculateSlideAnimationDuration(visuallyPreviousChord, songBpm, pulseDuration);
  const currentSlideDuration = calculateSlideAnimationDuration(visuallyCurrentChord, songBpm, pulseDuration);
  const nextSlideDuration = calculateSlideAnimationDuration(visuallyNextChord, songBpm, pulseDuration);

  const pulseDurationStr = pulseDuration.toFixed(2);

  const previousChordStyles: React.CSSProperties = visuallyPreviousChord ? {
    animationName: 'previousChordEnter',
    animationDuration: prevSlideDuration,
    animationIterationCount: '1',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  } : {};

  const currentChordStyles: React.CSSProperties = visuallyCurrentChord ? {
    animationName: 'metronome-pulse, currentChordEnter',
    animationDuration: `${pulseDurationStr}s, ${currentSlideDuration}`,
    animationIterationCount: 'infinite, 1',
    animationTimingFunction: 'ease-in-out, ease-out',
    animationFillMode: 'both',
  } : { 
    animationName: 'metronome-pulse',
    animationDuration: `${pulseDurationStr}s`,
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
    animationFillMode: 'both',
    opacity: 0.7, 
  };
  
  const nextChordStyles: React.CSSProperties = visuallyNextChord ? {
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
          {visuallyPreviousChord !== undefined && visuallyPreviousChord !== null && ( // Check for undefined and null
            <div 
              key={`prev-${visuallyPreviousChord.startTime}`}
              className="text-4xl sm:text-5xl md:text-7xl leading-none text-muted-foreground opacity-75 transform translate-y-1"
              style={previousChordStyles}
            >
              {visuallyPreviousChord.chord}
            </div>
          )}
        </div>
        
        <div className="w-1/2 flex justify-center">
          {visuallyCurrentChord ? (
            <div 
              key={`current-${visuallyCurrentChord.startTime}`}
              className={cn(
                "text-6xl sm:text-8xl md:text-[10rem] font-bold text-accent leading-none"
              )} 
              style={currentChordStyles}
            >
              {visuallyCurrentChord.chord}
            </div>
          ) : (
            <div 
              key="current-null"
              className="text-2xl md:text-4xl text-muted-foreground leading-none"
              style={currentChordStyles} 
            >
              -
            </div>
          )}
        </div>

        <div className="w-1/4 flex justify-start">
          {visuallyNextChord && (
            <div 
              key={`next-${visuallyNextChord.startTime}`}
              className="text-7xl sm:text-9xl md:text-[12rem] text-primary leading-none"
              style={nextChordStyles}
            >
              {visuallyNextChord.chord}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
