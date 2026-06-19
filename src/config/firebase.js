// Firebase initialization.
//
// NOTE: the Firebase web `apiKey` below is NOT a secret. It identifies the
// project to Google and is safe to ship in the client; access is controlled by
// Firestore security rules and (recommended) App Check. The Gemini API key,
// which IS secret, is no longer here at all: it lives server-side in the Cloud
// Function and is reached through /api/* (see src/services/gemini.js).
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// App ID used to namespace Firestore collections.
export const appId = process.env.REACT_APP_FIREBASE_APP_ID || 'ferhengi-jir';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
