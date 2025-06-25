'use server';

import { google } from 'googleapis';
import { cookies } from 'next/headers';
import type { Credentials } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const GOOGLE_TOKEN_COOKIE = 'google_auth_tokens';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXT_PUBLIC_BASE_URL) {
    console.error("Missing Google OAuth credentials or base URL in environment variables.");
}

function getOAuth2Client() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXT_PUBLIC_BASE_URL) {
        throw new Error("Google OAuth credentials or base URL are not configured.");
    }
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        `${NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
    );
}

export async function getGoogleAuthUrl(): Promise<string> {
    const oauth2Client = getOAuth2Client();
    const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.events'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
    });
}

export async function getTokensFromCode(code: string): Promise<Credentials> {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens) {
        throw new Error('Failed to retrieve tokens from Google.');
    }
    return tokens;
}

export async function saveTokens(tokens: Credentials): Promise<void> {
    cookies().set(GOOGLE_TOKEN_COOKIE, JSON.stringify(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

export async function getTokens(): Promise<Credentials | null> {
    const tokenCookie = cookies().get(GOOGLE_TOKEN_COOKIE);
    if (tokenCookie) {
        try {
            return JSON.parse(tokenCookie.value);
        } catch (error) {
            console.error("Failed to parse token cookie:", error);
            return null;
        }
    }
    return null;
}

export async function clearTokens(): Promise<void> {
    cookies().delete(GOOGLE_TOKEN_COOKIE);
}

export async function getAuthenticatedClient() {
    const tokens = await getTokens();
    if (!tokens) {
        return null;
    }
    
    const client = getOAuth2Client();
    client.setCredentials(tokens);

    // Check if the access token is expired (within 1 minute of expiry) and refresh if necessary
    if (tokens.expiry_date && tokens.expiry_date < (Date.now() + 60000)) {
        console.log("Google access token may be expired, attempting to refresh...");
        try {
            const { credentials } = await client.refreshAccessToken();
            client.setCredentials(credentials);
            await saveTokens(credentials); // Save the new tokens
            console.log("Google access token refreshed successfully.");
        } catch (error) {
            console.error("Error refreshing access token:", error);
            await clearTokens(); // The refresh token might be invalid, clear everything.
            return null;
        }
    }
    
    return client;
}
