
'use client';

import type { SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

interface SectionProgressBarProps {
  sections: SongSection[];
  currentSectionId: string | null;
  currentTime: number;
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
            behavior: 'smooth',
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
    <div className="w-full p-2 my-4 rounded-lg shadow-md bg-card">
      <div
        ref={scrollContainerRef}
        className="flex w-full h-12 rounded overflow-x-auto"
      >
        {sections.map((section, index) => {
          const itemRef = (el: HTMLDivElement | null) => sectionItemRefs.current[index] = el;

          const sectionWidthPercentage = (section.duration / totalDuration) * 100;
          const isActive = section.id === currentSectionId;

          let dynamicStyles: React.CSSProperties = {};
          const sectionBaseClasses = 'flex items-center justify-center text-xs md:text-sm font-medium transition-colors duration-300 ease-in-out border-r last:border-r-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-muted focus:ring-offset-1';
          let sectionModeClasses: string[] = [];

          if (isActive) {
            sectionModeClasses = ['bg-accent', 'text-accent-foreground', 'flex-grow', 'flex-shrink-0'];
            dynamicStyles = {
              flexBasis: 'auto',
              minWidth: 'max-content',
            };
          } else {
            sectionModeClasses = ['bg-secondary', 'text-secondary-foreground', 'hover:bg-muted', 'hover:text-muted-foreground', 'flex-shrink'];
            dynamicStyles = {
              flexBasis: `${sectionWidthPercentage}%`,
            };
          }

          return (
            <div
              key={section.id}
              ref={itemRef}
              role="button"
              tabIndex={0}
              className={cn(sectionBaseClasses, sectionModeClasses)}
              style={dynamicStyles}
              title={`${section.name} (${section.duration}s) - Click to jump`}
              onClick={() => onSectionSelect(section.startTime)}
              onKeyDown={(e) => handleKeyDown(e, section)}
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

