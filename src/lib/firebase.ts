import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration with your actual values
const firebaseConfig = {
  apiKey: "AIzaSyArau7AmleRNnzWE080F3QF8YGmMWtn_Kg",
  authDomain: "futuresight-cz4hh.firebaseapp.com",
  projectId: "futuresight-cz4hh",
  storageBucket: "futuresight-cz4hh.firebasestorage.app",
  messagingSenderId: "748902423337",
  appId: "1:748902423337:web:bd3e769c9190d1c1c9f538"
};

let app: any = null;
let auth: any = null;
let db: any = null;

// Initialize Firebase only in the browser
if (typeof window !== 'undefined') {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error; // Don't silently fail
  }
}

// Helper functions to safely get Firebase instances
export const getFirebaseAuth = () => auth;
export const getFirebaseApp = () => app;
export const getFirebaseDb = () => db;
export const isFirebaseConfigured = () => true; // Always configured now

export { app, auth, db };
