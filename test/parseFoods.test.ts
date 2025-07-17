import { parseFoods } from '../src/utils/parseFoods';
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Helper to restore fetch
const realFetch = global.fetch;

test('regex fallback parses text', async () => {
  delete process.env.VITE_OPENAI_API_KEY;
  const foods = await parseFoods('1 oeuf et 100g de banane');
  assert.equal(foods.length, 2);
  assert.equal(foods[0].nom, 'Oeuf');
  assert.equal(foods[0].quantite, 1);
  assert.equal(foods[0].unite, 'unite');
  assert.equal(foods[1].nom, 'Banane');
  assert.equal(foods[1].quantite, 100);
  assert.equal(foods[1].unite, 'g');
});

test('llm parser is used when API key is set', async () => {
  process.env.VITE_OPENAI_API_KEY = 'test';
  let called = false;
  global.fetch = async (): Promise<Pick<Response, 'ok' | 'json'>> => {
    called = true;
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '[{"nom":"Kiwi","quantite":1,"unite":"unite"}]'
            }
          }
        ]
      })
    };
  };
  const foods = await parseFoods('un kiwi');
  assert(called);
  assert.equal(foods.length, 1);
  assert.equal(foods[0].nom, 'Kiwi');
  assert.equal(foods[0].quantite, 1);
  assert.equal(foods[0].unite, 'unite');
  global.fetch = realFetch;
});
