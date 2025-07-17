export interface User {
  id?: string;
  name: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  gender: 'homme' | 'femme';
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
  ingredients: string[];
  instructions: string;
  prepTime?: string;
  fridgeLife?: string;
  freezerLife?: string;
}

export interface ParsedFood {
  nom: string;
  quantite: number;
  unite: string;
  marque?: string;
  gout?: string;
}
