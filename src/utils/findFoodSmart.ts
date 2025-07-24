import fuzzysort from 'fuzzysort';
import { SimpleFood } from './findClosestFood';
import { normalizeFoodName } from './normalizeFoodName';

export function findFoodSmart<T extends SimpleFood>(
  query: string,
  foods: T[]
): { food: T | null; alternatives: T[] } {
  const norm = normalizeFoodName(query);
  const normalizedFoods = foods.map(f => ({
    original: f,
    norm: normalizeFoodName(f.name)
  }));
  const exact = normalizedFoods.find(f => f.norm === norm);
  if (exact) return { food: exact.original, alternatives: [] };

  const results = fuzzysort.go(norm, normalizedFoods, { key: 'norm', threshold: -1000 });
  if (results.total === 0) return { food: null, alternatives: [] };

  const best = results[0].obj.original as T;
  const alts: T[] = [];
  if (results.length > 1 && results[1].score - results[0].score > -1) {
    alts.push(results[1].obj.original as T);
  }
  return { food: best, alternatives: alts };
}
