import { parseFoods } from '../src/utils/parseFoods';
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Helper to restore fetch
const realFetch = global.fetch;

test('regex fallback parses text', async () => {
  delete process.env.VITE_OPENAI_API_KEY;
  const foods = await parseFoods('1 oeuf et 100g de banane');
  assert.equal(foods.length, 2);
  assert.equal(foods[0].name, 'Oeuf');
  assert.equal(foods[0].quantity, 1);
  assert.equal(foods[0].unit, 'unite');
  assert.equal(foods[1].name, 'Banane');
  assert.equal(foods[1].quantity, 100);
  assert.equal(foods[1].unit, 'g');
});

test('llm parser is used when API key is set', async () => {
  process.env.VITE_OPENAI_API_KEY = 'test';
  let called = false;
  global.fetch = async () => {
    called = true;
    const payload = {
      choices: [
        {
          message: {
            content: '[{"name":"Kiwi","quantity":1,"unit":"unite"}]'
          }
        }
      ]
    };
    return {
      ok: true,
      text: async () => JSON.stringify(payload),
      json: async () => payload
    } as unknown as Response;
  };
  const foods = await parseFoods('un kiwi');
  assert(called);
  assert.equal(foods.length, 1);
  assert.equal(foods[0].name, 'Kiwi');
  assert.equal(foods[0].quantity, 1);
  assert.equal(foods[0].unit, 'unite');
  global.fetch = realFetch;
});
