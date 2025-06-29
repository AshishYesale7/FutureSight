
import { getTokensFromCode, saveGoogleTokensToFirestore } from '@/services/googleAuthService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
        return new NextResponse('Configuration error: NEXT_PUBLIC_BASE_URL is not set.', { status: 500 });
    }
    const redirectUrl = new URL(baseUrl);


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
    
    if (!state) {
        const noStateError = 'No state parameter received from Google.';
        console.error('Google Auth Error:', noStateError);
        redirectUrl.searchParams.set('google_auth_error', noStateError);
        return NextResponse.redirect(redirectUrl);
    }

    try {
        const { userId } = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString('ascii'));

        if (!userId) {
            throw new Error('User ID not found in state parameter.');
        }

        const tokens = await getTokensFromCode(code);
        await saveGoogleTokensToFirestore(userId, tokens); // Save to Firestore
        
        // Return a success page that closes itself instead of redirecting
        const htmlResponse = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Successful</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; text-align: center; color: #333; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #007bff; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Success!</h1>
                <p>Your Google account has been connected successfully.</p>
                <p>This window will now close.</p>
              </div>
              <script>
                setTimeout(() => window.close(), 1500);
              </script>
            </body>
          </html>
        `;

        return new NextResponse(htmlResponse, {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });

    } catch (err: any) {
        console.error("Failed to exchange code for tokens:", err.message);
        redirectUrl.searchParams.set('google_auth_error', 'token_exchange_failed');
        return NextResponse.redirect(redirectUrl);
    }
}
