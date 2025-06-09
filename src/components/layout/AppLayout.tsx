'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect } from 'react';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header'; 

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // AuthProvider already shows a global spinner, so null is fine here
    // to avoid double spinners if this component renders before AuthProvider's loading state is false.
    return null; 
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      {/* Adjust pl based on sidebar width for desktop. md:pl-64. On mobile, pl-0 as sidebar is a sheet. */}
      <div className="flex flex-1 flex-col md:pl-64"> 
        <Header /> {/* This is the mobile-only header */}
        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
