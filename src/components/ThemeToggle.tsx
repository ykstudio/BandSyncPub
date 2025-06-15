// src/components/ThemeToggle.tsx
'use client';

import { Moon, Sun, Palette } from 'lucide-react'; // Added Palette
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null until the theme is resolved client-side
    // to avoid hydration mismatch if the button icon depends on the theme.
    return <Button variant="outline" size="icon" disabled className="h-[1.2rem] w-[1.2rem]" />;
  }

  const renderIcon = () => {
    if (resolvedTheme === 'dark') {
      return <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />;
    }
    if (resolvedTheme === 'light') {
      return <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />;
    }
    // For tropic, chinatown, peach - use Palette icon
    return <Palette className="h-[1.2rem] w-[1.2rem] transition-all" />;
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
          {/* Using Palette as a generic icon for custom themes for now */}
          <Palette className="mr-2 h-4 w-4" /> 
          Tropic
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('chinatown')}>
          <Palette className="mr-2 h-4 w-4" />
          Chinatown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('peach')}>
          <Palette className="mr-2 h-4 w-4" />
          Peach
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
