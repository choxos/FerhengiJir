import { analyzeWord, translateTexts } from './gemini';

// Avoid initializing real Firebase; provide a fake authed user and no App Check.
// getIdToken is a plain function (not jest.fn) because CRA's jest preset sets
// resetMocks: true, which would otherwise wipe a mockResolvedValue before tests.
jest.mock('../config/firebase', () => ({
  auth: { currentUser: { getIdToken: () => Promise.resolve('test-token') } },
  appCheck: null,
}));

describe('gemini service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('analyzeWord posts term/direction with the auth header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translation: 'pirtûk', meanings: [] }),
    });
    global.fetch = fetchMock;

    const data = await analyzeWord('book', 'en-to-ku');

    expect(data.translation).toBe('pirtûk');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/analyze');
    expect(opts.headers.Authorization).toBe('Bearer test-token');
    expect(JSON.parse(opts.body)).toEqual({ term: 'book', direction: 'en-to-ku' });
  });

  test('surfaces the server error message on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Too many requests, slow down.' }),
    });

    await expect(analyzeWord('book', 'en-to-ku')).rejects.toThrow('Too many requests');
  });

  test('translateTexts returns the translations array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: ['a', 'b'] }),
    });

    await expect(translateTexts(['x', 'y'])).resolves.toEqual(['a', 'b']);
  });
});
