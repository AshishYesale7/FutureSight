
'use client';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Firebase auth state is initially loading
  const [mounted, setMounted] = useState(false); // Tracks if the component has mounted on the client

  useEffect(() => {
    setMounted(true); // Component has mounted

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Firebase auth state has been determined
    });
    return () => unsubscribe();
  }, []);

  // Before component is mounted on client, or while Firebase auth is loading, show spinner.
  // This ensures server and initial client render are consistent.
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If mounted and Firebase auth is resolved, render the context provider and children
  return (
    <AuthContext.Provider value={{ user, loading: false }}> {/* Ensure loading is false here once resolved */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
