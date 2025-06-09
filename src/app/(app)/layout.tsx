'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect } from 'react';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header'; // For mobile header

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null; // Or a loading spinner, but AuthProvider already handles one
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64"> {/* Adjust pl based on sidebar width */}
        <Header />
        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
