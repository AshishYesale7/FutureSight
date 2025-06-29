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
        // Check for refresh_token as a proxy for valid, long-term connection
        if (tokens && tokens.refresh_token) {
            return NextResponse.json({ isConnected: true });
        }
        return NextResponse.json({ isConnected: false });
    } catch (error) {
        console.error("Error checking Google connection status:", error);
        return NextResponse.json({ isConnected: false }, { status: 500 });
    }
}
