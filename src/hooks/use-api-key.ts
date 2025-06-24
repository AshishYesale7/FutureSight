'use client';

import { useContext } from 'react';
import { ApiKeyContext } from '@/context/ApiKeyContext';

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
