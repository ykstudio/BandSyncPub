// src/components/ThemeToggle.tsx
'use client';

import { Moon, Sun, Palette, TreePalm, Landmark } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Specific HSL/color string values for icons in the dropdown
const DARK_ICON_COLOR = 'hsl(220, 40%, 30%)'; // Navy Blue
const LIGHT_ICON_COLOR = 'hsl(0, 0%, 100%)';  // White
const TROPIC_ICON_COLOR = 'hsl(30, 90%, 55%)'; // Orange
const CHINATOWN_ICON_COLOR = 'hsl(0, 80%, 55%)'; // Red
const PEACH_PRIMARY_HSL = 'hsl(20 90% 70%)'; // Peach Theme Primary (for its icon)


export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null until the theme is resolved client-side
    return <Button variant="outline" size="icon" disabled className="h-[1.2rem] w-[1.2rem]" />;
  }

  const renderMainButtonIcon = () => {
    // The icon in the button will adopt the current theme's primary color via `text-primary`
    const iconClassName = "h-[1.2rem] w-[1.2rem] transition-all text-primary";
    
    if (resolvedTheme === 'dark') {
      return <Moon className={iconClassName} />;
    }
    if (resolvedTheme === 'light') {
      return <Sun className={iconClassName} />;
    }
    // For tropic, chinatown, peach - use Palette icon, also colored with current theme's primary
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" style={{ color: DARK_ICON_COLOR }} />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" style={{ color: LIGHT_ICON_COLOR }} />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('tropic')}>
          <TreePalm className="mr-2 h-4 w-4" style={{ color: TROPIC_ICON_COLOR }} /> 
          Tropic
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('chinatown')}>
          <Landmark className="mr-2 h-4 w-4" style={{ color: CHINATOWN_ICON_COLOR }} />
          Chinatown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('peach')}>
          <Palette className="mr-2 h-4 w-4" style={{ color: PEACH_PRIMARY_HSL }} />
          Peach
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
