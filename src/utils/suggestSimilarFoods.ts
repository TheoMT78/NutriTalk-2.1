import Fuse from 'fuse.js';
import { FoodItem } from '../types';
import { normalizeFoodName } from './normalizeFoodName';

/**
 * Suggest foods whose normalized names include the provided term
 * or the closest fuzzy matches when none are found.
 */
export function suggestSimilarFoods(term: string, foods: FoodItem[]): FoodItem[] {
  const norm = normalizeFoodName(term);
  const withTerm = foods.filter(f => {
    const n = normalizeFoodName(f.name);
    return n.includes(norm) && n !== norm;
  });
  if (withTerm.length > 0) return withTerm.slice(0, 5);

  const items = foods.map(f => ({ ...f, _norm: normalizeFoodName(f.name) }));
  const fuse = new Fuse(items, { keys: ['_norm'], threshold: 0.4 });
  return fuse.search(norm).map(r => r.item).slice(0, 5);
}
