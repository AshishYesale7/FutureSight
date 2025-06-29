import { getTokensFromCode, saveGoogleTokensToFirestore } from '@/services/googleAuthService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${requestUrl.protocol}//${requestUrl.host}`;
    const redirectUrl = new URL(baseUrl);


    if (error) {
        console.error('Google Auth Error:', error);
        
        // Provide a more helpful message for redirect_uri_mismatch
        const errorMessage = error === 'redirect_uri_mismatch'
            ? "Redirect URI Mismatch. Please ensure the 'Authorized redirect URIs' in your Google Cloud project settings exactly match your application's URL."
            : `${error}. Please try again.`;

        const htmlResponse = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Failed</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; text-align: center; color: #333; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #dc3545; }
                p { max-width: 600px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Authentication Failed</h1>
                <p>${errorMessage}</p>
                <p>This window will now close.</p>
              </div>
              <script>setTimeout(() => window.close(), 8000);</script>
            </body>
          </html>
        `;
        
        return new NextResponse(htmlResponse, {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        });
    }
    
    if (!code) {
        const noCodeError = 'No authorization code received from Google.';
        console.error('Google Auth Error:', noCodeError);
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.set('google_auth_error', noCodeError);
        return NextResponse.redirect(redirectUrl);
    }
    
    if (!state) {
        const noStateError = 'No state parameter received from Google.';
        console.error('Google Auth Error:', noStateError);
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.set('google_auth_error', noStateError);
        return NextResponse.redirect(redirectUrl);
    }

    try {
        const { userId } = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString('ascii'));

        if (!userId) {
            throw new Error('User ID not found in state parameter.');
        }

        // Pass the entire request object to get the correct redirect_uri
        const tokens = await getTokensFromCode(request, code);
        await saveGoogleTokensToFirestore(userId, tokens);
        
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
        
        const htmlResponse = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Failed</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; text-align: center; color: #333; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #dc3545; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Error</h1>
                <p>Authentication failed: ${err.message || 'Unknown error'}. Please try again.</p>
                <p>This window will now close.</p>
              </div>
              <script>setTimeout(() => window.close(), 8000);</script>
            </body>
          </html>
        `;

        return new NextResponse(htmlResponse, {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        });
    }
}
