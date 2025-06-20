
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from '@/context/ThemeContext'; // Import ThemeProvider
import { useTheme } from '@/hooks/use-theme'; // useTheme will now be context-aware
import { usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect } from 'react';

// This new component will be a child of ThemeProvider and can safely use the context-aware useTheme
function AppThemeApplicator({ children }: { children: ReactNode }) {
  const { theme: userPreferredTheme, isMounted } = useTheme(); // isMounted helps prevent premature class application
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth/');

  useEffect(() => {
    // Only apply theme if the hook is mounted and theme is settled.
    // This avoids potential flashes or applying SSR theme briefly before client theme is determined.
    if (isMounted) {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');

      if (isAuthPage) {
        root.classList.add('dark'); // Force dark theme for auth pages
      } else {
        root.classList.add(userPreferredTheme); // Apply user's preferred theme for other pages
      }
    }
  }, [pathname, userPreferredTheme, isAuthPage, isMounted]);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The useTheme() call for DOM manipulation is moved to AppThemeApplicator
  // to ensure it's within the ThemeProvider's context.

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FutureSight</title>
        <meta name="description" content="Track your career progress and exam preparation." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ThemeProvider>
            <AppThemeApplicator>
              {children}
              <Toaster />
            </AppThemeApplicator>
          </ThemeProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
