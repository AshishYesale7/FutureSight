'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  forceDark?: boolean;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'dark',
  forceDark = false 
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (forceDark) {
      // Force dark theme for auth pages
      setThemeState('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', 'dark');
      }
      return;
    }

    // Get stored theme or use system preference
    const storedTheme = typeof window !== 'undefined' 
      ? localStorage.getItem('theme') as Theme | null 
      : null;
    
    const systemTheme = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : 'dark';

    const initialTheme = storedTheme || systemTheme || defaultTheme;
    
    setThemeState(initialTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
  }, [defaultTheme, forceDark]);

  const setTheme = (newTheme: Theme) => {
    if (forceDark) return; // Don't allow theme changes when forced
    
    setThemeState(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  const toggleTheme = () => {
    if (forceDark) return; // Don't allow theme changes when forced
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="dark">
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}