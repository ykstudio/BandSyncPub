// src/components/ThemeProvider.tsx
'use client';

import type { ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

const AVAILABLE_THEMES = ['dark', 'light', 'tropic', 'chinatown', 'peach'];

export function ThemeProvider({ children, ...props }: ThemeProviderProps): ReactNode {
  return (
    <NextThemesProvider 
      {...props} 
      defaultTheme="dark"
      themes={AVAILABLE_THEMES}
    >
      {children}
    </NextThemesProvider>
  );
}
