'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect, useState } from 'react';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header'; // For mobile header
import { TodaysPlanModal } from '@/components/timeline/TodaysPlanModal';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Logic to show modal once per session
  useEffect(() => {
    if (!loading && user) {
      const hasSeenModal = sessionStorage.getItem('seenTodaysPlanModal');
      if (!hasSeenModal) {
        setIsPlanModalOpen(true);
        sessionStorage.setItem('seenTodaysPlanModal', 'true');
      }
    }
  }, [user, loading]);

  if (loading || !user) {
    return null; // Or a loading spinner, but AuthProvider already handles one
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
