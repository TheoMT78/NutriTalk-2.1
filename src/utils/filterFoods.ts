import removeAccents from 'remove-accents';
import { FoodItem } from '../types';

export function normalizeString(str: string): string {
  return removeAccents(str).toLowerCase().trim();
}

// Recherche intelligente sur chaque mot des noms et des synonymes
export function filterFoods(foods: FoodItem[], query: string): FoodItem[] {
  const nq = normalizeString(query);

  if (nq === 'farine') {
    const farineDeBle = foods.find(f =>
      normalizeString(f.name) === 'farine de ble' ||
      (f.synonyms && f.synonyms.some(s => normalizeString(s) === 'farine'))
    );
    const otherFarines = foods.filter(f =>
      normalizeString(f.name).startsWith('farine') &&
      normalizeString(f.name) !== 'farine de ble'
    );
    const result = [] as FoodItem[];
    if (farineDeBle) result.push(farineDeBle);
    result.push(...otherFarines);
    return result;
  }

  return foods.filter(f => {
    const words = normalizeString(f.name).split(' ');
    const synos = (f.synonyms || []).map(normalizeString);
    return words.concat(synos).some(word => word.startsWith(nq));
  });
}

/**
 * Find the best matching food for a parsed term. It first checks for an exact
 * match on the name or any synonym. If none is found, it falls back to the same
 * prefix logic as {@link filterFoods} and returns the first match.
 */
export function getFoodFromParsedText(
  foods: FoodItem[],
  parsed: string
): FoodItem | undefined {
  const nq = normalizeString(parsed);

  const exact = foods.find(
    f =>
      normalizeString(f.name) === nq ||
      (f.synonyms && f.synonyms.some(s => normalizeString(s) === nq))
  );
  if (exact) return exact;

  return foods.find(f => {
    const mots = normalizeString(f.name).split(' ');
    const synos = (f.synonyms || []).map(normalizeString);
    return mots.concat(synos).some(mot => mot.startsWith(nq));
  });
}
