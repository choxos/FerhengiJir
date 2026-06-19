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
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// App ID used to namespace Firestore collections.
export const appId = process.env.REACT_APP_FIREBASE_APP_ID || 'ferhengi-jir';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// App Check (recommended abuse protection for the /api proxy). Inert until you
// provide a reCAPTCHA v3 site key; the server only enforces when you flip the
// APP_CHECK_ENFORCE param, so this is safe to ship as-is.
export let appCheck = null;
const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // Non-fatal: the app still works without App Check.
    console.warn('App Check init failed', err);
  }
}

// Analytics. Inert unless a measurementId is configured and the environment
// supports it (no-op in unsupported browsers / SSR / tests).
let analytics = null;
if (firebaseConfig.measurementId) {
  isSupported()
    .then((ok) => { if (ok) analytics = getAnalytics(app); })
    .catch(() => {});
}

export function track(event, params) {
  if (!analytics) return;
  try {
    logEvent(analytics, event, params);
  } catch (_) {
    /* ignore analytics failures */
  }
}
