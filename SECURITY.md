# Security architecture

## What was wrong (the leak)

The app called the Gemini API directly from the browser:

```js
const apiUrl = `https://...:generateContent?key=${geminiApiKey}`;
```

`geminiApiKey` came from `REACT_APP_GEMINI_API_KEY`. In Create React App, **every**
`REACT_APP_*` variable is compiled into the public JavaScript bundle (it is
embedded wherever any code references `process.env`, so it leaks even if you stop
importing it). Anyone could open DevTools, read the key from the bundle or the
Network tab, and reuse it. That is how the key was exposed.

## What changed

The Gemini key now lives **only** on the server and is never sent to the browser.

```
Browser ──(Firebase ID token)──▶ /api/analyze ─┐
                                                ├─▶ Cloud Function ──(secret key)──▶ Gemini
Browser ──(Firebase ID token)──▶ /api/translate-text ─┘
```

- `functions/index.js` is a Cloud Function holding the key as a Firebase **secret**.
- `firebase.json` rewrites `/api/**` to that function, so the client calls a
  same-origin relative URL (`src/services/gemini.js`); no key client-side.
- The function **requires a valid Firebase Auth ID token**, builds the prompt
  itself (callers cannot send arbitrary prompts and abuse the key as a free LLM),
  validates input sizes, and applies a best-effort per-user rate limit.
- `firestore.rules` restricts each user to their own `favorites`/`history`;
  everything else is denied.
- `firebase.json` adds security headers (CSP, HSTS, X-Frame-Options, etc.).

The Firebase **web** `apiKey` (`AIza…`) is still in the client bundle. That is
expected and safe: it identifies the project, it is not a secret, and access is
controlled by Firestore rules + App Check.

## One-time setup

Cloud Functions require the **Blaze** (pay-as-you-go) plan. It has a free monthly
tier; set a budget alert in the Google Cloud console to cap spend.

```bash
# 1. Install function deps
cd functions && npm install && cd ..

# 2. Store the (NEW, regenerated) Gemini key as a server-side secret
firebase functions:secrets:set GEMINI_API_KEY

# 3. Deploy rules + function + hosting
npm run build
firebase deploy --only firestore:rules,functions,hosting
```

Generate a **new** Gemini key in Google AI Studio; the old one was exposed and
should stay disabled/deleted.

## Local development

```bash
firebase emulators:start          # functions + firestore + hosting on one origin
# then serve the app through the hosting emulator, OR set REACT_APP_API_BASE
# to the functions emulator URL in .env (see env.example).
```

## Recommended next step: App Check

Auth + rate limiting stop casual abuse. For real protection against scripted
abuse of the proxy, enable [Firebase App Check](https://firebase.google.com/docs/app-check)
(reCAPTCHA v3 / Enterprise) and call `verifyToken` on the App Check header inside
the function. This ties requests to your actual web app, not just any signed-in
client.
