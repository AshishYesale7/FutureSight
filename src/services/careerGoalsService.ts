
'use server';

import { db } from '@/lib/firebase';
import type { CareerGoal } from '@/types';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';

const getGoalsCollection = (userId: string) => {
  return collection(db, 'users', userId, 'careerGoals');
};

// Type conversion helper
const fromFirestore = (doc: any): CareerGoal => {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title,
        description: data.description,
        progress: data.progress,
        // Convert Firestore Timestamp to JS Date
        deadline: data.deadline ? (data.deadline as Timestamp).toDate() : undefined,
    };
};

export const getCareerGoals = async (userId: string): Promise<CareerGoal[]> => {
  const goalsCollection = getGoalsCollection(userId);
  const snapshot = await getDocs(goalsCollection);
  return snapshot.docs.map(fromFirestore);
};

export const saveCareerGoal = async (userId: string, goal: CareerGoal): Promise<void> => {
  const goalsCollection = getGoalsCollection(userId);
  const goalDocRef = doc(goalsCollection, goal.id);
  
  // Convert JS Date back to Firestore Timestamp for storing
  const dataToSave = {
    ...goal,
    deadline: goal.deadline ? Timestamp.fromDate(goal.deadline) : null,
  };

  await setDoc(goalDocRef, dataToSave);
};

export const deleteCareerGoal = async (userId: string, goalId: string): Promise<void> => {
  const goalsCollection = getGoalsCollection(userId);
  const goalDocRef = doc(goalsCollection, goalId);
  await deleteDoc(goalDocRef);
};
