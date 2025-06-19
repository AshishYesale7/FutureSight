
'use client';

// Removed: import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useTheme } from '@/hooks/use-theme';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Metadata object is removed as 'use client' makes it incompatible here.
// Title and meta description are set directly in the <head> below.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme: userPreferredTheme } = useTheme(); // This is the theme for the dashboard
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth/');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark'); // Clear any existing theme class

    if (isAuthPage) {
      root.classList.add('dark'); // Force dark theme for auth pages
    } else {
      root.classList.add(userPreferredTheme); // Apply user's preferred theme for other pages
    }
  }, [pathname, userPreferredTheme, isAuthPage]);

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
          {children}
          <Toaster />
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
