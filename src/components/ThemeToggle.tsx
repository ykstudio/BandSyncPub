
// src/components/ThemeToggle.tsx
'use client';

import { Moon, Sun, Palette, TreePalm, Landmark, Apple } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Specific HSL/color string values for icons in the dropdown
const DARK_ICON_NAVY_COLOR = 'hsl(220, 40%, 30%)';
const LIGHT_ICON_WHITE_COLOR = 'hsl(0, 0%, 100%)'; 
const TROPIC_ICON_ORANGE_COLOR = 'hsl(30, 90%, 55%)'; // This is for TreePalm, Mango accent is hsl(35 90% 60%)
const CHINATOWN_ICON_RED_COLOR = 'hsl(0, 80%, 55%)';
const PEACH_APPLE_ICON_REDDISH_PINK_COLOR = 'hsl(5, 85%, 73%)';


export function ThemeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null until the theme is resolved client-side
    return <Button variant="outline" size="icon" disabled className="h-[1.2rem] w-[1.2rem]" />;
  }

  const renderMainButtonIcon = () => {
    const iconClassName = "h-[1.2rem] w-[1.2rem] transition-all text-primary";
    
    // Use theme (the explicitly set theme) first, then resolvedTheme as fallback for icon logic
    const currentThemeForIcon = theme || resolvedTheme;

    if (currentThemeForIcon === 'dark') {
      return <Moon className={iconClassName} />;
    }
    if (currentThemeForIcon === 'light') {
      return <Sun className={iconClassName} />;
    }
    // For tropic, chinatown, peach - use Palette icon, colored with current theme's primary
    return <Palette className={iconClassName} />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {renderMainButtonIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="bg-neutral-200 dark:bg-neutral-700" // Removed text-neutral-800
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
  );
}
