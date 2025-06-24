'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback, useContext } from 'react';

const API_KEY_STORAGE_KEY = 'futuresight-gemini-api-key';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isMounted: boolean;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const getInitialApiKey = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error(`Error reading from localStorage key “${API_KEY_STORAGE_KEY}”:`, error);
    return null;
  }
};

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(getInitialApiKey);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (isMounted) {
      // Also update state if storage changes in another tab
      const handleStorageChange = () => {
        setApiKeyState(getInitialApiKey());
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [isMounted]);

  const setApiKey = useCallback((key: string | null) => {
    try {
      if (key) {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
      setApiKeyState(key);
    } catch (error) {
      console.error(`Error setting localStorage key “${API_KEY_STORAGE_KEY}”:`, error);
    }
  }, []);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isMounted }}>
      {children}
    </ApiKeyContext.Provider>
  );
};
