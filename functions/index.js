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
 *   - Builds the prompt server-side, so callers cannot turn the key into a
 *     free general-purpose LLM (no arbitrary prompt passthrough).
 *   - Validates and caps all input sizes.
 *   - Best-effort per-user rate limiting.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
// it is a guardrail rather than a hard quota. App Check is the recommended
// next layer for real abuse protection.
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
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
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

async function callGemini(payload, apiKey) {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    logger.error('Gemini error', response.status, detail.slice(0, 500));
    const err = new Error('Upstream AI request failed');
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error('Empty AI response');
    err.status = 502;
    throw err;
  }
  return text;
}

async function handleAnalyze(body, apiKey) {
  const term = String(body.term || '').trim();
  const direction = body.direction === 'ku-to-en' ? 'ku-to-en' : 'en-to-ku';
  if (!term) {
    const err = new Error('Missing term');
    err.status = 400;
    throw err;
  }
  if (term.length > MAX_TERM_LENGTH) {
    const err = new Error('Term too long');
    err.status = 400;
    throw err;
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
  return JSON.parse(text);
}

async function handleTranslateText(body, apiKey) {
  const texts = Array.isArray(body.texts) ? body.texts : [];
  if (texts.length === 0) {
    const err = new Error('Missing texts');
    err.status = 400;
    throw err;
  }
  if (texts.length > MAX_TEXTS) {
    const err = new Error('Too many texts');
    err.status = 400;
    throw err;
  }
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
