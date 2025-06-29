
'use server';

import { db } from '@/lib/firebase';
import type { TimelineEvent } from '@/types';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp, query, orderBy, getDoc } from 'firebase/firestore';
import { getAuthenticatedClient } from './googleAuthService';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from './googleCalendarService';

const getTimelineEventsCollection = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return collection(db, 'users', userId, 'timelineEvents');
};

const fromFirestore = (docData: any): TimelineEvent => {
    const data = docData.data();
    return {
        id: docData.id,
        ...data,
        // Convert Firestore Timestamp to JS Date
        date: data.date ? (data.date as Timestamp).toDate() : new Date(),
        endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
        // Ensure deletable is set, defaulting based on ID prefix if not present
        isDeletable: data.isDeletable === undefined ? (docData.id.startsWith('ai-') ? true : false) : data.isDeletable,
        googleEventId: data.googleEventId || undefined,
    };
};

export const getTimelineEvents = async (userId: string): Promise<TimelineEvent[]> => {
  const eventsCollection = getTimelineEventsCollection(userId);
  // Order by date to get them in a sensible default order
  const q = query(eventsCollection, orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
};

type SaveTimelineEventOptions = {
    syncToGoogle: boolean;
};

export const saveTimelineEvent = async (
    userId: string,
    event: Omit<TimelineEvent, 'icon' | 'date' | 'endDate'> & { date: string; endDate?: string | null },
    options: SaveTimelineEventOptions
): Promise<void> => {
    const eventsCollection = getTimelineEventsCollection(userId);
    const eventDocRef = doc(eventsCollection, event.id);

    let googleEventId = event.googleEventId || null;
    const client = await getAuthenticatedClient(userId);

    if (client) { // Only attempt sync if user is connected
        try {
            if (options.syncToGoogle) {
                // User wants this event on Google Calendar
                const eventPayloadForGoogle: TimelineEvent = {
                    ...event,
                    date: new Date(event.date),
                    endDate: event.endDate ? new Date(event.endDate) : undefined,
                } as TimelineEvent;

                if (googleEventId) {
                    // Update existing event
                    await updateGoogleCalendarEvent(userId, googleEventId, eventPayloadForGoogle);
                } else {
                    // Create new event
                    const newGoogleEvent = await createGoogleCalendarEvent(userId, eventPayloadForGoogle);
                    if (newGoogleEvent && newGoogleEvent.id) {
                        googleEventId = newGoogleEvent.id;
                    }
                }
            } else if (!options.syncToGoogle && googleEventId) {
                // User wants to unsync this event, delete it from Google Calendar
                await deleteGoogleCalendarEvent(userId, googleEventId);
                googleEventId = null; // Clear the ID from our record
            }
        } catch (error) {
            console.error("Error syncing event to Google Calendar:", error);
            // Don't block saving to Firestore if Google sync fails
        }
    }

    const dataToSave = {
        ...event,
        date: Timestamp.fromDate(new Date(event.date)),
        endDate: event.endDate ? Timestamp.fromDate(new Date(event.endDate)) : null,
        googleEventId: googleEventId, // Persist the new or nulled ID
    };

    await setDoc(eventDocRef, dataToSave, { merge: true });
};

export const deleteTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
    const eventsCollection = getTimelineEventsCollection(userId);
    const eventDocRef = doc(eventsCollection, eventId);

    try {
        const docSnap = await getDoc(eventDocRef);
        if (docSnap.exists()) {
            const eventData = docSnap.data();
            if (eventData.googleEventId) {
                // If the event is linked to Google, delete it there first.
                await deleteGoogleCalendarEvent(userId, eventData.googleEventId);
            }
        }
    } catch (error) {
        console.error(`Error deleting associated Google Calendar event for event ${eventId}:`, error);
        // We will still proceed to delete from Firestore even if the Google delete fails.
    }
    
    // Finally, delete the event from Firestore.
    await deleteDoc(eventDocRef);
};
