
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'futuresight-theme'; // Changed key to be more specific

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isMounted: boolean; // To help consumers know if theme is settled post-hydration
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark'; // Default for SSR, client will override
  }
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
    return storedTheme;
  }
  // If no stored preference, check system preference.
  // const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // return systemPrefersDark ? 'dark' : 'light';
  return 'dark'; // Default to dark if no stored preference and not using system pref explicitly
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // On initial mount, re-evaluate theme in case localStorage was set by another tab or initial SSR was different
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
        setThemeState(storedTheme);
    } else {
        // Fallback if localStorage is somehow cleared or invalid after initial getInitialTheme
        // This part might be redundant if getInitialTheme is robust enough for client side.
        // For now, default to 'dark' if nothing valid is found after mount.
        setThemeState('dark');
    }
  }, []);

  useEffect(() => {
    if (isMounted) { // Only update localStorage and class if mounted and theme has changed
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      // The actual class application to document.documentElement will be handled
      // by RootLayout's useEffect, as it needs pathname for auth page logic.
    }
  }, [theme, isMounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Do not apply class directly from here to avoid conflict with RootLayout's logic which knows about auth pages.
  // RootLayout will consume `theme` from context and apply it.

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
};
