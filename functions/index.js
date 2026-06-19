/**
 * Ferhengî Jîr - server-side Gemini proxy.
 *
 * The Gemini API key lives ONLY here (as a Firebase secret) and is never
 * shipped to the browser. The previous version embedded the key in the client
 * bundle, which is why it leaked. All AI calls now flow through this function:
 *
 *   POST /api/analyze         { term, direction }      -> word analysis JSON
 *   POST /api/translate-text  { texts: string[] }      -> English translations
 *
 * Hardening applied here:
 *   - Requires a valid Firebase Auth ID token (anonymous sign-in is fine).
 *   - Optional Firebase App Check enforcement (set the APP_CHECK_ENFORCE secret
 *     to "true" once reCAPTCHA is configured) to tie requests to the real app.
 *   - Builds the prompt server-side, so callers cannot turn the key into a
 *     free general-purpose LLM (no arbitrary prompt passthrough).
 *   - Validates and caps all input sizes.
 *   - Best-effort per-user rate limiting.
 *   - Shared Firestore cache for word analyses (cuts cost and latency).
 *   - Retries transient upstream failures and surfaces safety blocks clearly.
 */

const crypto = require('crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();
const firestore = admin.firestore();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
// App Check enforcement is read from a plain env var (default off) so deploys
// never prompt. To enforce, add `APP_CHECK_ENFORCE=true` to functions/.env and
// redeploy once reCAPTCHA/App Check is configured.

const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CACHE_COLLECTION = 'aiCache';
const CACHE_VERSION = 1; // bump to invalidate all cached analyses

// Origins allowed to call the function directly (cross-origin). In production
// the app is served same-origin via a Hosting rewrite, so CORS is not needed
// there; this list only matters for local development.
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5000',
  'https://ferhengijir-choxos.web.app',
  'https://ferhengijir-choxos.firebaseapp.com',
]);

// Limits to keep the endpoint cheap and abuse-resistant.
const MAX_TERM_LENGTH = 100;
const MAX_TEXTS = 20;
const MAX_TEXT_LENGTH = 1000;

// Best-effort in-memory rate limit. This is per warm instance, not global, so
// it is a guardrail rather than a hard quota. App Check is the real protection.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;
const rateBuckets = new Map();

function rateLimited(uid) {
  const now = Date.now();
  const hits = (rateBuckets.get(uid) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(uid, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(uid, hits);
  return false;
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Firebase-AppCheck');
    res.set('Access-Control-Max-Age', '3600');
  }
}

async function requireAuth(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (err) {
    logger.warn('ID token verification failed', err.message);
    return null;
  }
}

// Returns true if the request may proceed past App Check. When enforcement is
// off, this always returns true (and just records a warning on bad tokens).
async function appCheckAllowed(req) {
  const enforce = (process.env.APP_CHECK_ENFORCE || '').toLowerCase() === 'true';
  const token = req.headers['x-firebase-appcheck'];
  if (!token) return !enforce;
  try {
    await admin.appCheck().verifyToken(String(token));
    return true;
  } catch (err) {
    logger.warn('App Check verification failed', err.message);
    return !enforce;
  }
}

const ANALYSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    translation: { type: 'STRING' },
    meanings: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          kurdish_word: { type: 'STRING' },
          partOfSpeech: { type: 'STRING' },
          kurdish_explanation: { type: 'STRING' },
          example: {
            type: 'OBJECT',
            properties: {
              sourceSentence: { type: 'STRING' },
              translatedSentence: { type: 'STRING' },
            },
          },
        },
        required: ['kurdish_word', 'partOfSpeech', 'kurdish_explanation'],
      },
    },
    informal_meanings: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          term: { type: 'STRING' },
          context_ku: { type: 'STRING' },
        },
        required: ['term', 'context_ku'],
      },
    },
    other_languages: {
      type: 'OBJECT',
      properties: {
        kurmanji_latin: { type: 'STRING' },
        arabic: { type: 'STRING' },
        persian: { type: 'STRING' },
        turkish: { type: 'STRING' },
        french: { type: 'STRING' },
        german: { type: 'STRING' },
      },
    },
    synonyms: { type: 'ARRAY', items: { type: 'STRING' } },
    antonyms: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['translation', 'meanings'],
};

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Calls Gemini, retrying once on transient (5xx / network) failures, and turns
// safety blocks and malformed output into clear errors.
async function callGemini(payload, apiKey, attempt = 0) {
  let response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (netErr) {
    if (attempt < 1) {
      await sleep(400);
      return callGemini(payload, apiKey, attempt + 1);
    }
    logger.error('Gemini network error', netErr.message);
    throw httpError('Upstream AI request failed', 502);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    logger.error('Gemini error', response.status, detail.slice(0, 500));
    if (response.status === 429) throw httpError('AI is rate limited, try again shortly', 429);
    if (response.status >= 500 && attempt < 1) {
      await sleep(400);
      return callGemini(payload, apiKey, attempt + 1);
    }
    throw httpError('Upstream AI request failed', 502);
  }

  const result = await response.json().catch(() => null);
  if (!result) throw httpError('Malformed AI response', 502);

  if (result.promptFeedback && result.promptFeedback.blockReason) {
    throw httpError('Request was blocked by the safety filter', 422);
  }
  const candidate = result.candidates && result.candidates[0];
  if (candidate && candidate.finishReason === 'SAFETY') {
    throw httpError('Response was blocked by the safety filter', 422);
  }
  const text = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0]
    ? candidate.content.parts[0].text
    : null;
  if (!text) throw httpError('Empty AI response', 502);
  return text;
}

async function handleAnalyze(body, apiKey) {
  const term = String(body.term || '').trim();
  const direction = body.direction === 'ku-to-en' ? 'ku-to-en' : 'en-to-ku';
  if (!term) throw httpError('Missing term', 400);
  if (term.length > MAX_TERM_LENGTH) throw httpError('Term too long', 400);

  // Shared cache: identical (direction, term) lookups are served from Firestore
  // instead of paying for another Gemini call. Dictionary entries are stable.
  const cacheKey = crypto
    .createHash('sha1')
    .update(`${CACHE_VERSION}|${direction}|${term.toLowerCase()}`)
    .digest('hex');
  const cacheRef = firestore.collection(CACHE_COLLECTION).doc(cacheKey);

  try {
    const cached = await cacheRef.get();
    if (cached.exists) {
      const data = cached.data();
      if (data && data.payload) return data.payload;
    }
  } catch (err) {
    logger.warn('Cache read failed', err.message);
  }

  const [sourceLang, targetLang] =
    direction === 'en-to-ku' ? ['English', 'Kurdish (Sorani)'] : ['Kurdish (Sorani)', 'English'];

  const prompt =
    `Analyze the ${sourceLang} word "${term}". Provide a comprehensive translation and ` +
    `analysis in ${targetLang} optimized for a Kurdish speaker learning English. ` +
    `Provide synonyms and antonyms in ${sourceLang}. The response must be a JSON object.`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: ANALYSIS_SCHEMA },
  };

  const text = await callGemini(payload, apiKey);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    logger.error('Analysis JSON parse failed', err.message);
    throw httpError('AI returned an unreadable response', 502);
  }

  cacheRef
    .set({ payload: parsed, direction, term, createdAt: admin.firestore.FieldValue.serverTimestamp() })
    .catch((err) => logger.warn('Cache write failed', err.message));

  return parsed;
}

async function handleTranslateText(body, apiKey) {
  const texts = Array.isArray(body.texts) ? body.texts : [];
  if (texts.length === 0) throw httpError('Missing texts', 400);
  if (texts.length > MAX_TEXTS) throw httpError('Too many texts', 400);
  const clean = texts.map((t) => String(t || '').slice(0, MAX_TEXT_LENGTH));

  const translations = await Promise.all(
    clean.map(async (explanation) => {
      try {
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: `Provide only the direct English translation for the following Kurdish text: "${explanation}"` },
              ],
            },
          ],
        };
        const text = await callGemini(payload, apiKey);
        return text.trim();
      } catch (err) {
        logger.warn('Single translation failed', err.message);
        return 'Translation failed.';
      }
    })
  );

  return { translations };
}

exports.api = onRequest(
  { secrets: [GEMINI_API_KEY], cors: false, region: 'us-central1', maxInstances: 10 },
  async (req, res) => {
    applyCors(req, res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!(await appCheckAllowed(req))) {
      res.status(401).json({ error: 'App Check verification required' });
      return;
    }

    const decoded = await requireAuth(req);
    if (!decoded) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (rateLimited(decoded.uid)) {
      res.status(429).json({ error: 'Too many requests, slow down.' });
      return;
    }

    // Route by the trailing path segment: /api/analyze or /api/translate-text
    const path = (req.path || '').replace(/\/+$/, '');
    const action = path.split('/').pop();
    const body = typeof req.body === 'object' && req.body ? req.body : {};

    try {
      let data;
      if (action === 'analyze') {
        data = await handleAnalyze(body, GEMINI_API_KEY.value());
      } else if (action === 'translate-text') {
        data = await handleTranslateText(body, GEMINI_API_KEY.value());
      } else {
        res.status(404).json({ error: 'Unknown action' });
        return;
      }
      res.status(200).json(data);
    } catch (err) {
      const status = err.status || 500;
      logger.error('Request failed', action, status, err.message);
      res.status(status).json({ error: status === 500 ? 'Internal error' : err.message });
    }
  }
);
