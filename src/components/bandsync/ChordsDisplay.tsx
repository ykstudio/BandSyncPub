
import type { ChordChange } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChordsDisplayProps {
  chords: ChordChange[];
  currentTime: number;
  songBpm: number;
}

export function ChordsDisplay({ chords, currentTime, songBpm }: ChordsDisplayProps) {
  const currentChordIndex = chords.findIndex(c => currentTime >= c.startTime && currentTime < c.endTime);
  
  const currentChord = currentChordIndex !== -1 ? chords[currentChordIndex] : null;
  const previousChord = currentChordIndex > 0 ? chords[currentChordIndex - 1] : null;
  const nextChord = currentChordIndex !== -1 && currentChordIndex < chords.length - 1 ? chords[currentChordIndex + 1] : null;

  const pulseDuration = songBpm > 0 ? 60 / songBpm : 0.5; // Beat duration
  const entrySlideAnimationDuration = songBpm > 0 ? pulseDuration * 1.5 : 0.75; // 1.5 beats for entry/slide

  const previousChordStyles: React.CSSProperties = {
    animationName: 'previousChordEnter',
    animationDuration: `${entrySlideAnimationDuration}s`,
    animationIterationCount: '1',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  };

  const currentChordStyles: React.CSSProperties = {
    animationName: 'metronome-pulse, currentChordEnter',
    animationDuration: `${pulseDuration}s, ${entrySlideAnimationDuration}s`,
    animationIterationCount: 'infinite, 1',
    animationTimingFunction: 'ease-in-out, ease-out',
    animationFillMode: 'both',
  };
  
  const nextChordStyles: React.CSSProperties = {
    animationName: 'nextChordEnter',
    animationDuration: `${entrySlideAnimationDuration}s`,
    animationIterationCount: '1',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-md flex flex-col items-center justify-center h-48 md:h-96 overflow-hidden"> {/* Added overflow-hidden */}
      <div className="flex items-end justify-center space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8 w-full">
        <div className="w-1/4 flex justify-end">
          {previousChord && (
            <div 
              key={`prev-${previousChord.chord}-${previousChord.startTime}`}
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
              key={`current-${currentChord.chord}-${currentChord.startTime}`}
              className={cn(
                "text-6xl sm:text-8xl md:text-[10rem] font-bold text-accent leading-none"
              )} 
              style={currentChordStyles}
            >
              {currentChord.chord}
            </div>
          ) : (
            <div className="text-2xl md:text-4xl text-muted-foreground leading-none">
              -
            </div>
          )}
        </div>

        <div className="w-1/4 flex justify-start">
          {nextChord && (
            <div 
              key={`next-${nextChord.chord}-${nextChord.startTime}`}
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
