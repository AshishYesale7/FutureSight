import { getTokensFromCode, saveTokens } from '@/services/googleAuthService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const redirectUrl = new URL('/', request.url)

    if (error) {
        console.error('Google Auth Error:', error);
        redirectUrl.searchParams.set('google_auth_error', error);
        return NextResponse.redirect(redirectUrl);
    }
    
    if (!code) {
        const noCodeError = 'No authorization code received from Google.';
        console.error('Google Auth Error:', noCodeError);
        redirectUrl.searchParams.set('google_auth_error', noCodeError);
        return NextResponse.redirect(redirectUrl);
    }

    try {
        const tokens = await getTokensFromCode(code);
        await saveTokens(tokens);
        redirectUrl.searchParams.set('google_auth_success', 'true');
    } catch (err: any) {
        console.error("Failed to exchange code for tokens:", err.message);
        redirectUrl.searchParams.set('google_auth_error', 'token_exchange_failed');
    }

    // Redirect user back to the dashboard
    return NextResponse.redirect(redirectUrl);
}
