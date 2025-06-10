
import type { SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SectionProgressBarProps {
  sections: SongSection[];
  currentSectionId: string | null;
  currentTime: number; // For potential intra-section progress, not fully implemented here
}

export function SectionProgressBar({ sections, currentSectionId }: SectionProgressBarProps) {
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);
  if (totalDuration === 0) return null;

  return (
    <div className="w-full p-2 my-4 rounded-lg shadow-md bg-card">
      <div className="flex w-full h-12 rounded overflow-hidden">
        {sections.map((section) => {
          const sectionWidthPercentage = (section.duration / totalDuration) * 100;
          const isActive = section.id === currentSectionId;

          let dynamicStyles: React.CSSProperties = {};
          const sectionBaseClasses = 'flex items-center justify-center text-xs md:text-sm font-medium transition-colors duration-300 ease-in-out border-r last:border-r-0';
          let sectionModeClasses: string[] = [];

          if (isActive) {
            sectionModeClasses = ['bg-accent', 'text-accent-foreground', 'flex-grow', 'flex-shrink-0'];
            dynamicStyles = {
              flexBasis: 'auto', // Base size on content
              minWidth: 'max-content', // Ensure it's at least as wide as its content
            };
          } else {
            sectionModeClasses = ['bg-secondary', 'text-secondary-foreground', 'hover:bg-muted', 'flex-shrink'];
            // flex-grow is 0 by default for items with a flex-basis other than auto.
            dynamicStyles = {
              flexBasis: `${sectionWidthPercentage}%`, // Set width based on duration percentage
            };
          }

          return (
            <div
              key={section.id}
              className={cn(sectionBaseClasses, sectionModeClasses)}
              style={dynamicStyles}
              title={`${section.name} (${section.duration}s)`}
            >
              <span className={cn(
                "inline-block px-1",
                isActive ? "whitespace-nowrap" : "truncate"
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
