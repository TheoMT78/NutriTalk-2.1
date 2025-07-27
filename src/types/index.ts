export interface User {
  id?: string;
  name: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  gender: 'homme' | 'femme';
  birthDate?: string;
  weightKg?: number;
  heightCm?: number;
  sex?: 'homme' | 'femme';
  activityLevel: 'sédentaire' | 'légère' | 'modérée' | 'élevée' | 'très élevée';
  goal: 'perte5' | 'perte10' | 'maintien' | 'prise5' | 'prise10';
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailyWater: number;
  password?: string;
  stepGoal: number;
  avatar: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

export interface FoodEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  category: string;
  meal: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
  timestamp: string;
}

export interface DailyLog {
  date: string;
  entries: FoodEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  totalVitaminC?: number;
  water: number;
  steps: number;
  targetCalories: number;
  weight?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  brand?: string;
  fiber?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  category: string;
  unit: string;
  isFavorite?: boolean;
  isCustom?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  /** Description optionnelle de la recette */
  description?: string;
  /** Liste des ingrédients */
  ingredients: string[];
  /** Étapes de préparation */
  instructions: string[];
  /** URL de la photo */
  image?: string;
  /** Catégories sélectionnées (Petit-déj, Déjeuner…) */
  categories?: string[];
  /** Temps de préparation, ex "25 min" */
  prepTime?: string;
  /** Temps de cuisson, ex "30 min" */
  cookTime?: string;
  /** Nombre de portions */
  servings?: number;
  /** Valeurs nutritionnelles pour une portion */
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugars?: number;
  fridgeLife?: string;
  freezerLife?: string;
}

export interface ParsedFood {
  name: string;
  quantity: number;
  unit: string;
  brand?: string;
  flavor?: string;
}
