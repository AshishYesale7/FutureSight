import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AUTH_ROUTES = ['/auth/signin', '/auth/signup'];
const PROTECTED_ROUTES = ['/', '/career-goals', '/skills', '/career-vision', '/news', '/resources']; // Add all your app routes here

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('firebaseIdToken'); // Example, adjust based on your auth setup

  // If trying to access auth page while logged in, redirect to home
  if (sessionToken && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If trying to access protected page while not logged in, redirect to signin
  if (!sessionToken && PROTECTED_ROUTES.some(route => pathname.startsWith(route) && pathname !== '/')) {
     if (pathname === '/' && !AUTH_ROUTES.includes(pathname)) { // Allow access to / as a public page if needed, or redirect
        // For this app, '/' is protected too.
         return NextResponse.redirect(new URL('/auth/signin', request.url));
     } else if (PROTECTED_ROUTES.includes(pathname)) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
     }
  }
   // Special handling for the root path if it's protected
  if (pathname === '/' && !sessionToken) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
