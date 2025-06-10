
'use client';

import type { SongSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

interface SectionProgressBarProps {
  sections: SongSection[];
  currentSectionId: string | null;
  currentTime: number; // For potential intra-section progress, not fully implemented here
}

export function SectionProgressBar({ sections, currentSectionId }: SectionProgressBarProps) {
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Use an array of refs for individual section items
  const sectionItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ensure refs array is always the correct size for the sections
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
            inline: 'center', // Tries to center the element horizontally
            block: 'nearest',  // Ensures vertical visibility if applicable
          });
        }
      }
    }
  }, [currentSectionId, sections]);


  if (totalDuration === 0) return null;

  return (
    <div className="w-full p-2 my-4 rounded-lg shadow-md bg-card">
      <div
        ref={scrollContainerRef}
        className="flex w-full h-12 rounded overflow-x-auto" // Changed overflow-hidden to overflow-x-auto
      >
        {sections.map((section, index) => {
          // Assign ref to each section item
          const itemRef = (el: HTMLDivElement | null) => sectionItemRefs.current[index] = el;

          const sectionWidthPercentage = (section.duration / totalDuration) * 100;
          const isActive = section.id === currentSectionId;

          let dynamicStyles: React.CSSProperties = {};
          const sectionBaseClasses = 'flex items-center justify-center text-xs md:text-sm font-medium transition-colors duration-300 ease-in-out border-r last:border-r-0';
          let sectionModeClasses: string[] = [];

          if (isActive) {
            sectionModeClasses = ['bg-accent', 'text-accent-foreground', 'flex-grow', 'flex-shrink-0'];
            dynamicStyles = {
              flexBasis: 'auto',
              minWidth: 'max-content',
            };
          } else {
            sectionModeClasses = ['bg-secondary', 'text-secondary-foreground', 'hover:bg-muted', 'flex-shrink'];
            dynamicStyles = {
              flexBasis: `${sectionWidthPercentage}%`,
            };
          }

          return (
            <div
              key={section.id}
              ref={itemRef} // Assign the ref here
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
