
'use client';
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

// Helper function to safely access localStorage
const setStoredTheme = (theme: Theme) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('theme', theme);
  }
};

export function useTheme() {
  // Theme is always 'dark'. useState is used to fit the hook structure.
  const [themeState, setThemeStateInternal] = useState<Theme>('dark');

  useEffect(() => {
    // This effect runs only on the client after hydration
    // Force dark theme
    const forcedTheme = 'dark';
    setThemeStateInternal(forcedTheme);
    setStoredTheme(forcedTheme);
    document.documentElement.classList.remove('light'); // Remove light if it was somehow set
    document.documentElement.classList.add(forcedTheme);
  }, []); // Empty dependency array, runs once on mount

  // setTheme function will now only allow setting to 'dark'
  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'dark') {
      setThemeStateInternal('dark');
      setStoredTheme('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    // If 'light' is passed, we ignore it to keep the theme dark.
  }, []);

  // toggleTheme function now ensures the theme remains (or is set to) dark
  const toggleTheme = useCallback(() => {
    setTheme('dark');
  }, [setTheme]);

  // Always return 'dark' as the current theme
  return { theme: 'dark' as const, setTheme, toggleTheme };
}

