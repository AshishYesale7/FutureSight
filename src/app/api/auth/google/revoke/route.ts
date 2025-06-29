import { clearGoogleTokensFromFirestore, getAuthenticatedClient } from '@/services/googleAuthService';
import { google } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
        }

        const client = await getAuthenticatedClient(userId);
        
        if (client) {
             try {
                // This revokes both access and refresh tokens.
                await client.revokeCredentials();
                console.log(`Successfully revoked Google token for user ${userId}.`);
            } catch (revokeError) {
                console.warn(`Failed to revoke Google token for user ${userId}, it may already be invalid. Clearing from DB anyway.`, revokeError);
            }
        }

        await clearGoogleTokensFromFirestore(userId);
        return NextResponse.json({ success: true, message: 'Google session cleared.' });
    } catch (error) {
        console.error('Error revoking Google session:', error);
        return NextResponse.json({ success: false, message: 'Failed to clear session.' }, { status: 500 });
    }
}
