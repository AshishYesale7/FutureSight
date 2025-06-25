
import { getGoogleAuthUrl } from '@/services/googleAuthService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const url = await getGoogleAuthUrl();
        return NextResponse.redirect(url);
    } catch (error: any) {
        console.error("Failed to get Google Auth URL:", error.message);
        // Redirect to a generic error page or the home page with an error query param
        // Using request.url ensures we redirect back to the correct host.
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('google_auth_error', 'setup_failed');
        return NextResponse.redirect(redirectUrl);
    }
}
