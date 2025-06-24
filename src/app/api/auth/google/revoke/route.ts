import { clearTokens, getTokens } from '@/services/googleAuthService';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const tokens = getTokens();
        // Attempt to revoke the token with Google first
        if (tokens && tokens.access_token) {
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials(tokens);
            try {
                await oauth2Client.revokeCredentials();
                console.log("Successfully revoked Google token.");
            } catch (revokeError) {
                console.warn("Failed to revoke Google token, it may already be invalid. Clearing local tokens anyway.", revokeError);
            }
        }

        clearTokens();
        return NextResponse.json({ success: true, message: 'Google session cleared.' });
    } catch (error) {
        console.error('Error revoking Google session:', error);
        return NextResponse.json({ success: false, message: 'Failed to clear session.' }, { status: 500 });
    }
}
