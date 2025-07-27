import { basicFoods } from './basicFoods';
import { normalizeFoodName } from './normalizeFoodName';

export interface RecipeMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugars?: number;
}

export function computeRecipeMacros(ingredients: string[]): RecipeMacros {
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugars: 0 };

  for (const ing of ingredients) {
    const match = ing.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)?\s*(.+)/i);
    if (!match) continue;
    let qty = parseFloat(match[1]);
    let unit = (match[2] || 'g').toLowerCase();
    let name = match[3];

    if (unit === 'kg' || unit === 'l') qty *= 1000;

    const norm = normalizeFoodName(name);
    const food = basicFoods.find(f =>
      normalizeFoodName(f.name).includes(norm) ||
      norm.includes(normalizeFoodName(f.name))
    );
    if (!food) continue;
    const mult = qty / 100;
    totals.calories += food.calories * mult;
    totals.protein += food.protein * mult;
    totals.carbs += food.carbs * mult;
    totals.fat += food.fat * mult;
  }

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    fiber: totals.fiber ? Math.round(totals.fiber) : undefined,
    sugars: totals.sugars ? Math.round(totals.sugars) : undefined
  };
}
