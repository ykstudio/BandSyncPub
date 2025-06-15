// src/components/ThemeToggle.tsx
'use client';

import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// HSL string values for primary colors of custom themes for icon preview
const TROPIC_PRIMARY_HSL = 'hsl(180 60% 45%)';
const CHINATOWN_PRIMARY_HSL = 'hsl(40 90% 60%)';
const PEACH_PRIMARY_HSL = 'hsl(20 90% 70%)';

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

  const renderIcon = () => {
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
          {renderIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('tropic')}>
          <Palette className="mr-2 h-4 w-4" style={{ color: TROPIC_PRIMARY_HSL }} /> 
          Tropic
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('chinatown')}>
          <Palette className="mr-2 h-4 w-4" style={{ color: CHINATOWN_PRIMARY_HSL }} />
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
