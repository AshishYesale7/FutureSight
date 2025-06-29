
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { UserPreferences } from '@/types';

const getUserDocRef = (userId: string) => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    return doc(db, 'users', userId);
};

export const saveUserGeminiApiKey = async (userId: string, apiKey: string | null): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
        // Using setDoc with merge:true will create the document if it doesn't exist,
        // or update it if it does, without overwriting other fields.
        // Storing null is fine to indicate no key.
        await setDoc(userDocRef, { geminiApiKey: apiKey }, { merge: true });
    } catch (error) {
        console.error("Failed to save Gemini API key to Firestore:", error);
        throw new Error("Could not save API key to your account.");
    }
};

export const getUserGeminiApiKey = async (userId: string): Promise<string | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().geminiApiKey) {
            return docSnap.data().geminiApiKey;
        }
        return null;
    } catch (error) {
        console.error("Failed to get Gemini API key from Firestore:", error);
        throw new Error("Could not retrieve API key from your account.");
    }
};

export const saveUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
        await setDoc(userDocRef, { preferences }, { merge: true });
    } catch (error) {
        console.error("Failed to save user preferences to Firestore:", error);
        throw new Error("Could not save your daily plan preferences.");
    }
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().preferences) {
            return docSnap.data().preferences as UserPreferences;
        }
        // Return default preferences if none are set
        return { wakeUpTime: '07:00', bedtime: '23:00' };
    } catch (error) {
        console.error("Failed to get user preferences from Firestore:", error);
        // Return default preferences on error
        return { wakeUpTime: '07:00', bedtime: '23:00' };
    }
};
