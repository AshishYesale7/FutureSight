
'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'theme';

// Function to get the initial theme (runs only on client)
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'; // Default for server (won't be applied visually until client hydration)
  }
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
    return storedTheme;
  }
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return systemPrefersDark ? 'dark' : 'light';
};

export function useTheme() {
  // Initialize state with a function to ensure it's only called on the client
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  // Effect to apply the theme and update localStorage whenever `theme` state changes.
  // This runs on initial client render and after every theme change.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  // Effect to listen for system theme changes (e.g., OS toggles dark/light mode)
  // and update the theme if it's not already pinned by user in localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Only update if there's no theme explicitly set in localStorage
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setThemeState(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);


  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // The theme state is now initialized correctly on the client.
  // For SSR, it might initially render with the default 'light' and then switch.
  // `suppressHydrationWarning` on <html> helps manage this.
  return { theme, setTheme, toggleTheme };
}
