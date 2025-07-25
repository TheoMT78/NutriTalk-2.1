import { normalizeFoodName } from './normalizeFoodName';
import { findClosestFoods } from './findClosestFood';
import { KNOWN_BRANDS } from './brands';
import type { SimpleFood } from './findClosestFood';

export function shouldUseGemini(input: string, foods: SimpleFood[]): boolean {
  const normalizedInput = normalizeFoodName(input);
  if (KNOWN_BRANDS.some(b => normalizedInput.includes(normalizeFoodName(b)))) {
    return true;
  }
  const vocabulary = new Set(
    foods
      .flatMap(f => normalizeFoodName(f.name).split(/\s+/))
  );
  const words = normalizedInput.split(/\s+/);
  if (words.some(w => !vocabulary.has(w))) {
    return true;
  }
  const candidates = findClosestFoods(normalizedInput, foods, 2);
  if (candidates.length === 0) return true;
  if (candidates[0].score > 2) return true;
  if (candidates.length > 1 && candidates[1].score - candidates[0].score <= 1) {
    return true;
  }
  return false;
}
