
'use server';

import { db } from '@/lib/firebase';
import type { UserSubscription } from '@/types';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';

export const updateUserSubscriptionStatus = async (
  userId: string,
  subscriptionData: UserSubscription
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const userDocRef = doc(db, 'users', userId);

  // Convert Date to Firestore Timestamp for storing
  const dataToSave = {
    subscription: {
        ...subscriptionData,
        endDate: Timestamp.fromDate(subscriptionData.endDate),
    }
  };

  // Use setDoc with merge: true to add/update the subscription field without overwriting the whole document
  await setDoc(userDocRef, dataToSave, { merge: true });
};

export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists() && docSnap.data().subscription) {
        const sub = docSnap.data().subscription;
        // Convert timestamp back to date
        return {
            ...sub,
            endDate: (sub.endDate as Timestamp).toDate(),
        } as UserSubscription;
    } else {
        // User exists but has no subscription, or user doc doesn't exist yet.
        // Create a new 7-day trial subscription.
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        const newTrialSubscription: UserSubscription = {
            status: 'trial',
            endDate: trialEndDate,
        };
        
        // Save it to the database for this user
        await updateUserSubscriptionStatus(userId, newTrialSubscription);
        
        // Return the newly created trial subscription
        return newTrialSubscription;
    }
};
