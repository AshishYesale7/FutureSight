
'use server';

import { getGoogleTokensFromFirestore } from '@/services/googleAuthService';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ isConnected: false }, { status: 400 });
        }
        const tokens = await getGoogleTokensFromFirestore(userId);
        
        // A user is considered connected if we have tokens stored for them.
        // The getAuthenticatedClient service handles refreshing the access token if needed.
        // Checking just for a refresh_token is unreliable as it's often only sent on the first authorization.
        if (tokens && (tokens.access_token || tokens.refresh_token)) {
            return NextResponse.json({ isConnected: true });
        }
        
        return NextResponse.json({ isConnected: false });
    } catch (error) {
        console.error("Error checking Google connection status:", error);
        return NextResponse.json({ isConnected: false }, { status: 500 });
    }
}
