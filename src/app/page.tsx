
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import AppLayout from '@/app/(app)/layout'; // Import the AppLayout
import DashboardContent from '@/app/(app)/page'; // Import the Dashboard content

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect if not loading AND user is not authenticated
    if (!loading && !user) {
      router.replace('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is authenticated, render the dashboard directly
  if (user) {
    return (
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    );
  }

  // If not loading and no user (should have been caught by useEffect, but as a fallback)
  // or if in a transient state before useEffect kicks in, show loading or null.
  // This state should ideally not be reached if useEffect works as expected.
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}
