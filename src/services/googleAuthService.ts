'use server';

import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { deleteField } from 'firebase/firestore';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

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

export async function getGoogleAuthUrl(state?: string | null): Promise<string> {
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
        state: state ?? undefined,
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

// Firestore-based token management
export async function saveGoogleTokensToFirestore(userId: string, tokens: Credentials): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    if (!tokens.refresh_token) {
        console.warn("Attempting to save Google tokens without a refresh token. User may need to re-authenticate later.");
    }
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { google_tokens: tokens }, { merge: true });
}

export async function getGoogleTokensFromFirestore(userId: string): Promise<Credentials | null> {
    if (!db) throw new Error("Firestore is not initialized.");
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists() && docSnap.data().google_tokens) {
        return docSnap.data().google_tokens as Credentials;
    }
    return null;
}

export async function clearGoogleTokensFromFirestore(userId: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
        google_tokens: deleteField()
    });
}

export async function getAuthenticatedClient(userId: string) {
    const tokens = await getGoogleTokensFromFirestore(userId);
    if (!tokens) {
        return null;
    }
    
    const client = getOAuth2Client();
    client.setCredentials(tokens);

    // Check if the access token is expired (within 1 minute of expiry) and refresh if necessary
    if (tokens.expiry_date && tokens.expiry_date < (Date.now() + 60000)) {
        console.log(`Google access token for user ${userId} may be expired, attempting to refresh...`);
        try {
            const { credentials } = await client.refreshAccessToken();
            // The new credentials might not include a refresh token, so merge them
            const newTokens = { ...tokens, ...credentials };
            client.setCredentials(newTokens);
            await saveGoogleTokensToFirestore(userId, newTokens); // Save the new tokens
            console.log(`Google access token for user ${userId} refreshed successfully.`);
        } catch (error) {
            console.error(`Error refreshing access token for user ${userId}:`, error);
            await clearGoogleTokensFromFirestore(userId); // The refresh token might be invalid, clear everything.
            return null;
        }
    }
    
    return client;
}
