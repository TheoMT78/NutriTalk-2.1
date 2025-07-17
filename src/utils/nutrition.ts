export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function calculateTDEE({ weight, height, age, gender, activityLevel, goal }:
  { weight: number; height: number; age: number; gender: 'homme' | 'femme'; activityLevel: string; goal: 'perte5' | 'perte10' | 'maintien' | 'prise5' | 'prise10'; }): number {
  // Formule de Mifflin-St Jeor
  const bmr = gender === 'homme'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const activityMultipliers: Record<string, number> = {
    'sédentaire': 1.2,
    'légère': 1.375,
    'modérée': 1.55,
    'élevée': 1.725,
    'très élevée': 1.9
  };

  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

  // Ajustement selon l'objectif
  let goalMultiplier = 1;
  switch (goal) {
    case 'perte5':
      goalMultiplier = 0.95;
      break;
    case 'perte10':
      goalMultiplier = 0.9;
      break;
    case 'prise5':
      goalMultiplier = 1.05;
      break;
    case 'prise10':
      goalMultiplier = 1.1;
      break;
    default:
      goalMultiplier = 1;
  }

  return Math.round(tdee * goalMultiplier);
}

export function calculateMacroTargets(calories: number): Omit<MacroTargets, 'calories'> {
  const proteinCalories = calories * 0.25; // 25% protéines
  const fatCalories = calories * 0.25; // 25% lipides
  const carbsCalories = calories - proteinCalories - fatCalories; // 50% glucides
  return {
    protein: Math.round(proteinCalories / 4),
    carbs: Math.round(carbsCalories / 4),
    fat: Math.round(fatCalories / 9)
  };
}

export function computeDailyTargets(user: { weight: number; height: number; age: number; gender: 'homme' | 'femme'; activityLevel: string; goal: 'perte5' | 'perte10' | 'maintien' | 'prise5' | 'prise10'; }): MacroTargets {
  const calories = calculateTDEE(user);
  const macros = calculateMacroTargets(calories);
  return { calories, ...macros };
}
