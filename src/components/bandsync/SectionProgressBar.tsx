
'use client';

import type { SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

interface SectionProgressBarProps {
  sections: SongSection[];
  currentSectionId: string | null;
  currentTime: number; // Not directly used for progress logic here, but good for context
  onSectionSelect: (startTime: number) => void;
}

export function SectionProgressBar({ sections, currentSectionId, onSectionSelect }: SectionProgressBarProps) {
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    sectionItemRefs.current = sectionItemRefs.current.slice(0, sections.length);
  }, [sections]);

  useEffect(() => {
    if (currentSectionId && scrollContainerRef.current) {
      const activeSectionIndex = sections.findIndex(s => s.id === currentSectionId);
      if (activeSectionIndex !== -1) {
        const activeElement = sectionItemRefs.current[activeSectionIndex];
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: 'auto',
            inline: 'center',
            block: 'nearest',
          });
        }
      }
    }
  }, [currentSectionId, sections]);


  if (totalDuration === 0) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, section: SongSection) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onSectionSelect(section.startTime);
    }
  };

  return (
    <div className="w-full rounded-lg bg-muted px-2">
      <div
        ref={scrollContainerRef}
        className="flex w-full h-10 rounded overflow-x-auto"
      >
        {sections.map((section, index) => {
          const itemRef = (el: HTMLDivElement | null) => sectionItemRefs.current[index] = el;

          const sectionWidthPercentage = (section.duration / totalDuration) * 100;
          const isActive = section.id === currentSectionId;

          let dynamicStyles: React.CSSProperties = {};
          const sectionClasses = cn(
            'flex items-center justify-center text-xs font-medium transition-colors duration-300 ease-in-out border-r border-border last:border-r-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0',
            'px-2',
            isActive
              ? ['bg-accent-lightBg', 'font-semibold', 'flex-grow', 'flex-shrink-0'] // Removed 'text-accent'
              : ['text-secondary-foreground', 'hover:bg-secondary/80', 'flex-shrink']
          );


          if (isActive) {
            dynamicStyles = {
              flexBasis: 'auto',
              minWidth: 'max-content',
              color: 'hsl(var(--current-chord-text))', // Added color style for active section
            };
          } else {
             dynamicStyles = {
              flexBasis: `${sectionWidthPercentage}%`,
               minWidth: `${Math.max(sectionWidthPercentage, 5)}%`
            };
          }

          return (
            <div
              key={section.id}
              ref={itemRef}
              role="button"
              tabIndex={0}
              className={sectionClasses}
              style={dynamicStyles}
              title={`${section.name} (${section.duration}s) - Click to jump`}
              onClick={() => onSectionSelect(section.startTime)}
              onKeyDown={(e) => handleKeyDown(e, section)}
            >
              <span className={cn(
                "inline-block",
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

