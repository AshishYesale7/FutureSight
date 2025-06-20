
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect } from 'react';

function AppThemeApplicator({ children }: { children: ReactNode }) {
  const { theme: userPreferredTheme, backgroundImage, backgroundColor, isMounted } = useTheme();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth/');

  useEffect(() => {
    if (isMounted) {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');

      if (isAuthPage) {
        root.classList.add('dark');
      } else {
        root.classList.add(userPreferredTheme);
      }
      
      // Apply background color first, so image can go on top
      document.body.style.backgroundColor = backgroundColor || '';

      // Apply background image to body
      if (backgroundImage) {
        document.body.style.backgroundImage = `url("${backgroundImage}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed'; // Makes it fixed during scroll
      } else {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundAttachment = '';
      }
    }
  }, [pathname, userPreferredTheme, isAuthPage, backgroundImage, backgroundColor, isMounted]);

  // Clean up body styles on unmount or if background is removed
  useEffect(() => {
    return () => {
      if (isMounted) { // Check isMounted for cleanup as well
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundAttachment = '';
      }
    };
  }, [isMounted]);


  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

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
