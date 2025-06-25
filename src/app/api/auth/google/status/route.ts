'use server';

import { getTokens } from '@/services/googleAuthService';
import { NextResponse } from 'next/server';

export async function GET() {
    const tokens = await getTokens();
    // Check for access_token as a proxy for valid tokens
    if (tokens && tokens.access_token) {
        return NextResponse.json({ isConnected: true });
    }
    return NextResponse.json({ isConnected: false });
}
