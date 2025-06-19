'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'theme';

// Function to get the initial theme (runs only on client)
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark'; // Default 'dark' for server (client will override)
  }
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
    return storedTheme; // Respect stored preference
  }
  // If no stored preference, default to dark. User can then toggle.
  return 'dark';
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Effect to update localStorage whenever `theme` state changes.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      // The RootLayout will handle applying the class to documentElement
    }
  }, [theme]);

  // Effect to listen for system theme changes IF NO USER PREFERENCE IS SET.
  // This is less critical now that we default to dark if no preference is set.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Only update if there's no theme explicitly set in localStorage
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        // This part is now less likely to trigger as we default to 'dark' above
        // but kept for robustness if initial defaulting logic changes.
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

  return { theme, setTheme, toggleTheme }; // 'theme' is the user's preferred theme
}
