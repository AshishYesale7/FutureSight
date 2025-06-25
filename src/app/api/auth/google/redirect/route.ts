import { getGoogleAuthUrl } from '@/services/googleAuthService';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const url = await getGoogleAuthUrl();
        return NextResponse.redirect(url);
    } catch (error: any) {
        console.error("Failed to get Google Auth URL:", error.message);
        // Redirect to a generic error page or the home page with an error query param
        return NextResponse.redirect(new URL('/?error=google_auth_setup_failed', 'http://localhost:9002'));
    }
}
