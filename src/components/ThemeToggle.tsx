
// src/components/ThemeToggle.tsx
'use client';

import { Moon, Sun, Palette, TreePalm, Landmark, Apple } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const DARK_ICON_NAVY_COLOR = 'hsl(220, 40%, 30%)';
const LIGHT_ICON_WHITE_COLOR = 'hsl(0, 0%, 100%)'; 
const TROPIC_ICON_ORANGE_COLOR = 'hsl(30, 90%, 55%)';
const CHINATOWN_ICON_RED_COLOR = 'hsl(0, 80%, 55%)';
const PEACH_APPLE_ICON_REDDISH_PINK_COLOR = 'hsl(5, 85%, 73%)';


export function ThemeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const hideThemeToggleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAndRestartThemeToggleHideTimer = useCallback(() => {
    if (isMobile) {
      setIsVisible(true);
      if (hideThemeToggleTimerRef.current) {
        clearTimeout(hideThemeToggleTimerRef.current);
      }
      hideThemeToggleTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      showAndRestartThemeToggleHideTimer(); // Initial show and start timer

      const handleInteraction = () => {
        showAndRestartThemeToggleHideTimer();
      };
      
      window.addEventListener('click', handleInteraction);
      window.addEventListener('touchmove', handleInteraction);

      return () => {
        if (hideThemeToggleTimerRef.current) {
          clearTimeout(hideThemeToggleTimerRef.current);
        }
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchmove', handleInteraction);
      };
    } else {
      // Ensure button is always visible and timer is cleared on desktop
      setIsVisible(true);
      if (hideThemeToggleTimerRef.current) {
        clearTimeout(hideThemeToggleTimerRef.current);
        hideThemeToggleTimerRef.current = null;
      }
    }
  }, [isMobile, showAndRestartThemeToggleHideTimer]);


  if (!mounted) {
    // Render a placeholder or nothing until mounted to avoid hydration mismatch
    return <Button variant="outline" size="icon" disabled className="h-[1.2rem] w-[1.2rem]" />;
  }

  const renderMainButtonIcon = () => {
    const iconClassName = "h-[1.2rem] w-[1.2rem] transition-all text-primary";
    const currentThemeForIcon = theme || resolvedTheme;

    if (currentThemeForIcon === 'dark') {
      return <Moon className={iconClassName} />;
    }
    if (currentThemeForIcon === 'light') {
      return <Sun className={iconClassName} />;
    }
    return <Palette className={iconClassName} />;
  };

  return (
    <div className={cn(
        "transition-opacity duration-300 ease-in-out",
        (isMobile && !isVisible) ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            {renderMainButtonIcon()}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end"
          className="bg-neutral-200 dark:bg-neutral-700"
        >
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" style={{ color: DARK_ICON_NAVY_COLOR }} />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" style={{ color: LIGHT_ICON_WHITE_COLOR }} />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('tropic')}>
            <TreePalm className="mr-2 h-4 w-4" style={{ color: TROPIC_ICON_ORANGE_COLOR }} /> 
            Tropic
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('chinatown')}>
            <Landmark className="mr-2 h-4 w-4" style={{ color: CHINATOWN_ICON_RED_COLOR }} />
            Chinatown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('peach')}>
            <Apple className="mr-2 h-4 w-4" style={{ color: PEACH_APPLE_ICON_REDDISH_PINK_COLOR }} />
            Peach
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
