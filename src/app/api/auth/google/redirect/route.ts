
import { getGoogleAuthUrl } from '@/services/googleAuthService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const url = await getGoogleAuthUrl();
        return NextResponse.redirect(url);
    } catch (error: any) {
        console.error("Failed to get Google Auth URL:", error.message);
        
        // The base URL should be the single source of truth, especially in production.
        // Using request.url can be unreliable behind some reverse proxies.
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
            // If the base URL isn't set, we can't safely redirect. Return a plain error.
            return new NextResponse('Configuration error: NEXT_PUBLIC_BASE_URL is not set.', { status: 500 });
        }
        
        const redirectUrl = new URL(baseUrl);
        redirectUrl.searchParams.set('google_auth_error', 'setup_failed');
        return NextResponse.redirect(redirectUrl);
    }
}
