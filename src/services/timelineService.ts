
'use server';

import { db } from '@/lib/firebase';
import type { TimelineEvent } from '@/types';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';

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
    };
};

export const getTimelineEvents = async (userId: string): Promise<TimelineEvent[]> => {
  const eventsCollection = getTimelineEventsCollection(userId);
  // Order by date to get them in a sensible default order
  const q = query(eventsCollection, orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
};

export const saveTimelineEvent = async (userId: string, event: Omit<TimelineEvent, 'icon' | 'date' | 'endDate'> & { date: string; endDate?: string | null }): Promise<void> => {
  const eventsCollection = getTimelineEventsCollection(userId);
  const eventDocRef = doc(eventsCollection, event.id);
  
  // The event object is already serializable, we just need to convert date strings to Timestamps
  const dataToSave = {
    ...event,
    date: Timestamp.fromDate(new Date(event.date)),
    endDate: event.endDate ? Timestamp.fromDate(new Date(event.endDate)) : null,
  };

  await setDoc(eventDocRef, dataToSave, { merge: true });
};

export const deleteTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
  const eventsCollection = getTimelineEventsCollection(userId);
  const eventDocRef = doc(eventsCollection, eventId);
  await deleteDoc(eventDocRef);
};
