
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
  return 'dark'; // Default to dark theme
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark theme

  useEffect(() => {
    // This effect runs only on the client after hydration
    const storedTheme = getStoredTheme();
    const preferredTheme = getPreferredTheme();
    const initialTheme = storedTheme || preferredTheme;
    
    setThemeState(initialTheme);
    
    // Ensure the theme is applied to the document
    document.documentElement.className = initialTheme;
    
    // Store the theme if it wasn't already stored
    if (!storedTheme && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('theme', initialTheme);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('theme', newTheme);
    }
    document.documentElement.className = newTheme;
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
