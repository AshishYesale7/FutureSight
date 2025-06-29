
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserPreferences, RoutineItem } from '@/types';

const getUserDocRef = (userId: string) => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    return doc(db, 'users', userId);
};

const DEFAULT_ROUTINE: RoutineItem[] = [
    { id: '1', activity: 'Sleep', startTime: '23:00', endTime: '07:00', days: [0, 1, 2, 3, 4, 5, 6] },
    { id: '2', activity: 'College', startTime: '09:00', endTime: '17:00', days: [1, 2, 3, 4, 5] },
    { id: '3', activity: 'Gym', startTime: '18:00', endTime: '19:00', days: [1, 3, 5] },
    { id: '4', activity: 'Free Time', startTime: '19:00', endTime: '21:00', days: [0, 1, 2, 3, 4, 5, 6] },
];

export const saveUserGeminiApiKey = async (userId: string, apiKey: string | null): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
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
            // Basic validation to ensure it has the 'routine' property
            const prefs = docSnap.data().preferences;
            if (prefs && Array.isArray(prefs.routine)) {
                 return prefs as UserPreferences;
            }
        }
        // Return default preferences if none are set or if the structure is invalid
        return { routine: DEFAULT_ROUTINE };
    } catch (error) {
        console.error("Failed to get user preferences from Firestore:", error);
        // Return default preferences on error
        return { routine: DEFAULT_ROUTINE };
    }
};
