export interface ModificationIntent {
  name: string;
  meal: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
  newQuantity: number;
  unit: string;
  oldQuantity?: number;
}

import { parseFoods } from './parseFoods';

const mealMap: Record<ModificationIntent['meal'], RegExp> = {
  'petit-déjeuner': /(petit[- ]deje?uner|matin)/i,
  'déjeuner': /(deje?uner|midi)/i,
  'dîner': /(diner|dîner|soir)/i,
  'collation': /(collation|go\u00fbter)/i,
};

const intentPatterns: RegExp[] = [
  /au final/i,
  /j[ae] (?:change|changé|changée|modifi|modifié)/i,
  /ce n[’']?était pas/i,
  /au lieu de/i,
  /modifie/i,
];

export async function detectModificationIntent(
  message: string
): Promise<ModificationIntent | null> {
  const lower = message.toLowerCase();
  if (!intentPatterns.some(p => p.test(lower))) return null;

  let meal: ModificationIntent['meal'] = 'déjeuner';
  for (const [m, regex] of Object.entries(mealMap)) {
    if (regex.test(lower)) {
      meal = m as ModificationIntent['meal'];
      break;
    }
  }

  const foods = await parseFoods(message);
  if (!foods.length) return null;
  const { name, quantity, unit } = foods[0];

  let newQuantity = quantity;
  let oldQuantity: number | undefined;

  const auLieu = message.match(/(\d+(?:[.,]\d+)?)\s?(?:g|ml|kg|cas|cac)?[^\d]*(?:au lieu de|pas|n.?était pas)[^\d]*(\d+(?:[.,]\d+)?)/i);
  if (auLieu) {
    newQuantity = parseFloat(auLieu[1].replace(',', '.'));
    oldQuantity = parseFloat(auLieu[2].replace(',', '.'));
  } else {
    const modif = message.match(/modifie.*?(\d+(?:[.,]\d+)?)/i);
    if (modif) {
      newQuantity = parseFloat(modif[1].replace(',', '.'));
    }
  }

  return {
    name,
    meal,
    newQuantity,
    unit,
    oldQuantity,
  };
}
