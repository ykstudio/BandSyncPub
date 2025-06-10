import type { LyricLine, LyricWord } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
}

export function LyricsDisplay({ lyrics, currentTime }: LyricsDisplayProps) {
  return (
    <div className="p-4 space-y-3 text-lg md:text-xl leading-relaxed bg-card rounded-lg shadow-md h-64 md:h-96 overflow-y-auto">
      {lyrics.map((line, lineIndex) => (
        <p key={lineIndex} className="flex flex-wrap gap-x-1">
          {line.map((word, wordIndex) => {
            const isActive = currentTime >= word.startTime && currentTime < word.endTime;
            return (
              <span
                key={wordIndex}
                className={cn(
                  'transition-colors duration-100',
                  isActive ? 'text-accent font-bold' : 'text-foreground'
                )}
              >
                {word.text}
              </span>
            );
          })}
        </p>
      ))}
      {lyrics.length === 0 && <p className="text-muted-foreground">No lyrics available for this song.</p>}
    </div>
  );
}
