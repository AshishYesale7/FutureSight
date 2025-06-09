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

// Check if we have real Firebase config (not demo values)
const isValidConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
                     process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-api-key';

let app: any = null;
let auth: any = null;
let db: any = null;
let isFirebaseEnabled = false;

// Initialize Firebase if we're in the browser
if (typeof window !== 'undefined') {
  try {
    // Always initialize Firebase app (even with demo config for development)
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseEnabled = isValidConfig;
    
    if (!isValidConfig) {
      console.warn('Firebase initialized with demo configuration. Authentication will not work in production.');
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    // Create mock objects to prevent null errors
    app = { options: firebaseConfig };
    auth = null;
    db = null;
    isFirebaseEnabled = false;
  }
}

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = () => isFirebaseEnabled;

// Helper function to safely use auth
export const getFirebaseAuth = () => {
  if (!auth) {
    throw new Error('Firebase Auth is not available. Please check your Firebase configuration.');
  }
  return auth;
};

// Helper function to safely use firestore
export const getFirebaseDb = () => {
  if (!db) {
    throw new Error('Firestore is not available. Please check your Firebase configuration.');
  }
  return db;
};

export { app, auth, db };
