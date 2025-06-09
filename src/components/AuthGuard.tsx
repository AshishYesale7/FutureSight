'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to signin if authentication is required but user is not logged in
        router.push('/auth/signin');
      } else if (!requireAuth && user) {
        // Redirect to home if user is logged in but trying to access auth pages
        router.push('/');
      }
    }
  }, [user, loading, requireAuth, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For auth pages, show content if user is not logged in
  if (!requireAuth) {
    return user ? null : <>{children}</>;
  }

  // For protected pages, show content only if user is logged in
  return user ? <>{children}</> : null;
}