// Client-side wrapper around the server-side Gemini proxy.
//
// No API key here. Every call attaches the current user's Firebase ID token so
// the Cloud Function can authorize the request. The function builds the prompt
// and holds the secret key.
import { getToken } from 'firebase/app-check';
import { auth, appCheck } from '../config/firebase';

// Same-origin by default (Hosting rewrites /api/** to the function). For local
// development against the emulator, set REACT_APP_API_BASE.
const API_BASE = process.env.REACT_APP_API_BASE || '';

async function authedPost(path, body, signal) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  const token = await user.getIdToken();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Attach an App Check token when App Check is configured.
  if (appCheck) {
    try {
      const result = await getToken(appCheck, false);
      headers['X-Firebase-AppCheck'] = result.token;
    } catch (_) {
      /* proceed without it; server only enforces when configured to */
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data && data.error) message = data.error;
    } catch (_) {
      /* ignore parse errors */
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

// Analyze a single word; `direction` is 'en-to-ku' or 'ku-to-en'.
export function analyzeWord(term, direction, signal) {
  return authedPost('/api/analyze', { term, direction }, signal);
}

// Translate an array of Kurdish explanations to English. Returns string[].
export async function translateTexts(texts, signal) {
  const data = await authedPost('/api/translate-text', { texts }, signal);
  return Array.isArray(data.translations) ? data.translations : [];
}
