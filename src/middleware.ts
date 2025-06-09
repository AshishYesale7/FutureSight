
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AUTH_ROUTES = ['/auth/signin', '/auth/signup'];
const PROTECTED_ROUTES = ['/', '/career-goals', '/skills', '/career-vision', '/news', '/resources']; // Add all your app routes here

// Middleware is disabled for static export compatibility with GitHub Pages
// All authentication logic is handled client-side
export function middleware(request: NextRequest) {
  // For static export, we skip all middleware logic
  // Authentication is handled entirely on the client side
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
