import { shouldUseGemini } from '../src/utils/shouldUseGemini';
import { SimpleFood } from '../src/utils/findClosestFood';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const foods: SimpleFood[] = [
  { name: 'Farine de ble' },
  { name: 'Flocons d\'avoine' },
  { name: 'Banane' }
];

test('detects brand word', () => {
  const res = shouldUseGemini('100g de flocons d\'avoine MyProtein', foods);
  assert.equal(res, true);
});

test('uses local match when exact', () => {
  const res = shouldUseGemini('banane', foods);
  assert.equal(res, false);
});
