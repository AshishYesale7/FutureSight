
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect, useState } from 'react';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header'; // For mobile header
import { TodaysPlanModal } from '@/components/timeline/TodaysPlanModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, isSubscribed } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
      } else if (!isSubscribed && pathname !== '/subscription') {
        router.push('/subscription');
      }
    }
  }, [user, loading, isSubscribed, router, pathname]);

  // Logic to show modal once per session, ONLY on the dashboard
  useEffect(() => {
    if (!loading && user && isSubscribed && pathname === '/') {
      const hasSeenModal = sessionStorage.getItem('seenTodaysPlanModal');
      if (!hasSeenModal) {
        setIsPlanModalOpen(true);
        sessionStorage.setItem('seenTodaysPlanModal', 'true');
      }
    }
  }, [user, loading, isSubscribed, pathname]);

  if (loading || !user || (!isSubscribed && pathname !== '/subscription')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen">
        <SidebarNav />
        <div className="flex flex-1 flex-col md:pl-64"> {/* Adjusted pl for md screens and up */}
          <Header />
          <main className="flex-1 p-6 overflow-auto"> {/* Removed bg-background */}
            {children}
          </main>
        </div>
      </div>
      <TodaysPlanModal isOpen={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
    </>
  );
}
