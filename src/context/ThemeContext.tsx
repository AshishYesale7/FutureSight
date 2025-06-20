
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'futuresight-theme';
const BACKGROUND_IMAGE_STORAGE_KEY = 'futuresight-background-image';
const BACKGROUND_COLOR_STORAGE_KEY = 'futuresight-background-color';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  backgroundColor: string | null;
  setBackgroundColor: (color: string | null) => void;
  isMounted: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
    return storedTheme;
  }
  return 'dark';
};

const getInitialBackgroundImage = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(BACKGROUND_IMAGE_STORAGE_KEY);
};

const getInitialBackgroundColor = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(BACKGROUND_COLOR_STORAGE_KEY);
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(getInitialBackgroundImage);
  const [backgroundColor, setBackgroundColorState] = useState<string | null>(getInitialBackgroundColor);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
        setThemeState(storedTheme);
    } else {
        setThemeState('dark');
    }

    const storedBackgroundImage = localStorage.getItem(BACKGROUND_IMAGE_STORAGE_KEY);
    setBackgroundImageState(storedBackgroundImage);
    
    const storedBackgroundColor = localStorage.getItem(BACKGROUND_COLOR_STORAGE_KEY);
    setBackgroundColorState(storedBackgroundColor);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme, isMounted]);

  useEffect(() => {
    if (isMounted) {
      if (backgroundImage) {
        localStorage.setItem(BACKGROUND_IMAGE_STORAGE_KEY, backgroundImage);
      } else {
        localStorage.removeItem(BACKGROUND_IMAGE_STORAGE_KEY);
      }
    }
  }, [backgroundImage, isMounted]);
  
  useEffect(() => {
    if (isMounted) {
      if (backgroundColor) {
        localStorage.setItem(BACKGROUND_COLOR_STORAGE_KEY, backgroundColor);
      } else {
        localStorage.removeItem(BACKGROUND_COLOR_STORAGE_KEY);
      }
    }
  }, [backgroundColor, isMounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const setBackgroundImage = useCallback((url: string | null) => {
    setBackgroundImageState(url);
  }, []);
  
  const setBackgroundColor = useCallback((color: string | null) => {
    setBackgroundColorState(color);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, backgroundImage, setBackgroundImage, backgroundColor, setBackgroundColor, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
};
