
'use client';

import { useContext } from 'react';
import type { ThemeContextType } from '@/context/ThemeContext';
import { ThemeContext } from '@/context/ThemeContext';

// This custom hook now consumes the shared ThemeContext.
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
