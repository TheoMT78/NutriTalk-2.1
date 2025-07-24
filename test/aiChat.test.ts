import { parseFoodsFromInput } from '../src/utils/parseFoodsFromInput';
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('Parse multiple foods in a complex sentence', () => {
  const sentence = "ce matin j’ai mangé 2 œufs 40 g de farine et 50 g d’avoine de flocons d’avoine";
  const parsed = parseFoodsFromInput(sentence);
  assert.deepEqual(parsed, [
    { raw: '2 œufs', quantity: 2, name: 'œufs' },
    { raw: '40 g de farine', quantity: 40, name: 'farine' },
    { raw: '50 g d’avoine', quantity: 50, name: 'avoine' }
  ]);
});
