import { geminiAnalyzeText } from '../src/utils/nutritionSearch';
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('geminiAnalyzeText returns text', async () => {
  const realFetch = global.fetch;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  global.fetch = async (url: string, options?: Record<string, unknown>) => {
    if (url.endsWith('/gemini-nutrition')) {
      return { ok: true, json: async () => ({ result: 'hello' }) } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  };

  const res = await geminiAnalyzeText('bonjour');
  assert.equal(res, 'hello');
  global.fetch = realFetch;
});
