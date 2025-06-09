import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
};

// Check if we're in a build environment or if Firebase config is missing
const isValidConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app: any = null;
let auth: any = null;
let db: any = null;

// Only initialize Firebase if we have valid config and we're not in build mode
if (typeof window !== 'undefined' && isValidConfig) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
} else if (typeof window !== 'undefined') {
  console.warn('Firebase not initialized: Missing environment variables or in build mode');
}

export { app, auth, db };
