'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// This page acts as a temporary router.
// The middleware and (app)/layout.tsx handle the actual redirection logic.
// If a user lands here, it means something might be misconfigured or they are in a transient state.
export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/'); // Go to the dashboard, which is now at the root of (app) group
      } else {
        router.replace('/auth/signin');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}
