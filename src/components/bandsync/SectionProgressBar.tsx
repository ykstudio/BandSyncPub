
import type { SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SectionProgressBarProps {
  sections: SongSection[];
  currentSectionId: string | null;
  currentTime: number; // For potential intra-section progress, not fully implemented here
}

export function SectionProgressBar({ sections, currentSectionId, currentTime }: SectionProgressBarProps) {
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);
  if (totalDuration === 0) return null;

  return (
    <div className="w-full p-2 my-4 rounded-lg shadow-md bg-card">
      <div className="flex w-full h-12 rounded overflow-hidden">
        {sections.map((section) => {
          const sectionWidthPercentage = (section.duration / totalDuration) * 100;
          const isActive = section.id === currentSectionId;
          return (
            <div
              key={section.id}
              className={cn(
                'flex items-center justify-center text-xs md:text-sm font-medium transition-colors duration-300 ease-in-out border-r last:border-r-0',
                isActive ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted',
              )}
              style={{ width: `${sectionWidthPercentage}%` }}
              title={`${section.name} (${section.duration}s)`}
            >
              <span className={cn(
                "px-1",
                !isActive && "truncate" // Apply truncate only if not the active section
              )}>
                {section.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
