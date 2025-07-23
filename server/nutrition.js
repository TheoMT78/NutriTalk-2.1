export function computeAge(birthDate) {
  if (!birthDate) return 0;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  const a = new Date(diff);
  return Math.abs(a.getUTCFullYear() - 1970);
}

export function calculateTDEE({ weight, height, age, gender, activityLevel, goal }) {
  const bmr = gender === 'homme'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const activityMultipliers = {
    '0-1': 1.2,
    '1-2': 1.375,
    '3-5': 1.55,
    '6-7': 1.725,
    'plus de 7': 1.9,
    'sédentaire': 1.2,
    'légère': 1.375,
    'modérée': 1.55,
    'élevée': 1.725,
    'très élevée': 1.9,
  };
  let calories = bmr * (activityMultipliers[activityLevel] || 1.2);
  switch (goal) {
    case 'perte modérée (-10%)':
    case 'perte10':
      calories *= 0.9;
      break;
    case 'perte légère (-5%)':
    case 'perte5':
      calories *= 0.95;
      break;
    case 'prise légère (+5%)':
    case 'prise5':
      calories *= 1.05;
      break;
    case 'prise modérée (+10%)':
    case 'prise10':
      calories *= 1.1;
      break;
  }
  return Math.round(calories);
}

export function calculateMacroTargets(calories) {
  const proteinCalories = calories * 0.25;
  const fatCalories = calories * 0.25;
  const carbsCalories = calories - proteinCalories - fatCalories;
  return {
    protein: Math.round(proteinCalories / 4),
    carbs: Math.round(carbsCalories / 4),
    fat: Math.round(fatCalories / 9),
  };
}

export function computeDailyTargets(opts) {
  const age = computeAge(opts.birthDate);
  const cal = calculateTDEE({ ...opts, age });
  const macros = calculateMacroTargets(cal);
  return { calories: cal, ...macros };
}
