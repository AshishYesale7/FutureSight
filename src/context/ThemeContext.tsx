
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
type CustomTheme = Record<string, string>;
export type GlassEffect = 'frosted' | 'water-droplets' | 'subtle-shadow';

const THEME_STORAGE_KEY = 'futuresight-theme';
const BACKGROUND_IMAGE_STORAGE_KEY = 'futuresight-background-image';
const BACKGROUND_COLOR_STORAGE_KEY = 'futuresight-background-color';
const CUSTOM_THEME_STORAGE_KEY = 'futuresight-custom-theme';
const GLASS_EFFECT_STORAGE_KEY = 'futuresight-glass-effect';
const DEFAULT_BACKGROUND_IMAGE = 'https://img.freepik.com/premium-photo/abstract-holographic-defocused-foil-texture-background-with-frosted-glass-effect-background_1064085-619.jpg';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  backgroundColor: string | null;
  setBackgroundColor: (color: string | null) => void;
  customTheme: CustomTheme | null;
  setCustomTheme: (theme: CustomTheme | null) => void;
  glassEffect: GlassEffect;
  setGlassEffect: (effect: GlassEffect) => void;
  resetCustomizations: () => void;
  isMounted: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => getInitialState<Theme>(THEME_STORAGE_KEY, 'light'));
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(() => getInitialState<string | null>(BACKGROUND_IMAGE_STORAGE_KEY, DEFAULT_BACKGROUND_IMAGE));
  const [backgroundColor, setBackgroundColorState] = useState<string | null>(() => getInitialState<string | null>(BACKGROUND_COLOR_STORAGE_KEY, null));
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(() => getInitialState<CustomTheme | null>(CUSTOM_THEME_STORAGE_KEY, null));
  const [glassEffect, setGlassEffectState] = useState<GlassEffect>(() => getInitialState<GlassEffect>(GLASS_EFFECT_STORAGE_KEY, 'frosted'));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setItemInStorage = <T,>(key: string, value: T | null) => {
    if (isMounted) {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  };

  useEffect(() => setItemInStorage(THEME_STORAGE_KEY, theme), [theme, isMounted]);
  useEffect(() => setItemInStorage(BACKGROUND_IMAGE_STORAGE_KEY, backgroundImage), [backgroundImage, isMounted]);
  useEffect(() => setItemInStorage(BACKGROUND_COLOR_STORAGE_KEY, backgroundColor), [backgroundColor, isMounted]);
  useEffect(() => setItemInStorage(CUSTOM_THEME_STORAGE_KEY, customTheme), [customTheme, isMounted]);
  useEffect(() => setItemInStorage(GLASS_EFFECT_STORAGE_KEY, glassEffect), [glassEffect, isMounted]);


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
  
  const setCustomTheme = useCallback((theme: CustomTheme | null) => {
    setCustomThemeState(theme);
  }, []);

  const setGlassEffect = useCallback((effect: GlassEffect) => {
    setGlassEffectState(effect);
  }, []);

  const resetCustomizations = useCallback(() => {
    setBackgroundImage(DEFAULT_BACKGROUND_IMAGE);
    setBackgroundColor(null);
    setCustomTheme(null);
    setGlassEffect('frosted');
  }, [setBackgroundImage, setBackgroundColor, setCustomTheme, setGlassEffect]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, toggleTheme, 
      backgroundImage, setBackgroundImage, 
      backgroundColor, setBackgroundColor,
      customTheme, setCustomTheme,
      glassEffect, setGlassEffect,
      resetCustomizations,
      isMounted 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
