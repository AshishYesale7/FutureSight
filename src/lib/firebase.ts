import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Check if we have valid Firebase environment variables (not just placeholders)
const isValidConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
                     process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
                     process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-firebase-api-key-here' &&
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your-project-id' &&
                     process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN !== 'your-project-id.firebaseapp.com' &&
                     process.env.NEXT_PUBLIC_FIREBASE_API_KEY.length > 20;

// Debug logging for environment variables (only in browser)
if (typeof window !== 'undefined') {
  console.log('Firebase Environment Check:', {
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    apiKeyLength: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length || 0,
    hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    isValidConfig,
    mode: isValidConfig ? 'Firebase' : 'Demo'
  });
}

let app: any = null;
let auth: any = null;
let db: any = null;

// Only initialize Firebase if we have valid config and we're in the browser
if (typeof window !== 'undefined' && isValidConfig) {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Reset to null if initialization fails
    app = null;
    auth = null;
    db = null;
  }
} else if (typeof window !== 'undefined') {
  console.log('Running in demo mode: Firebase environment variables not configured');
}

export { app, auth, db };
