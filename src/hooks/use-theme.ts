
'use client';
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

// Helper function to safely access localStorage
const getStoredTheme = (): Theme | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('theme') as Theme | null;
  }
  return null;
};

const getPreferredTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light'; // Default if window or matchMedia is not available
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light'); // Default to light SSR

  useEffect(() => {
    // This effect runs only on the client after hydration
    const storedTheme = getStoredTheme();
    const preferredTheme = getPreferredTheme();
    const initialTheme = storedTheme || preferredTheme;
    
    setThemeState(initialTheme);
    document.documentElement.classList.remove('light', 'dark'); // Clear any server-set class
    document.documentElement.classList.add(initialTheme);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('theme', newTheme);
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
