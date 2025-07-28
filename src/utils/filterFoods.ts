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
