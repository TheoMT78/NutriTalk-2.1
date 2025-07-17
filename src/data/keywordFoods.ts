import { FoodItem } from '../types';

export interface KeywordFood {
  keywords: string[];
  food: FoodItem;
}

export const keywordFoods: KeywordFood[] = [
  { keywords: ['pâtes', 'pasta', 'spaghetti', 'tagliatelle'], food: { name: 'Pâtes cuites', calories: 131, protein: 5, carbs: 25, fat: 1.1, category: 'Féculents', unit: '100g' } },
  { keywords: ['riz', 'rice'], food: { name: 'Riz blanc cuit', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, category: 'Féculents', unit: '100g' } },
  { keywords: ['poulet', 'chicken'], food: { name: 'Blanc de poulet', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Protéines', unit: '100g' } },
  { keywords: ['œuf', 'oeuf', 'egg'], food: { name: 'Œufs', calories: 155, protein: 13, carbs: 1.1, fat: 11, category: 'Protéines', unit: '100g' } },
  { keywords: ['avocat', 'avocado'], food: { name: 'Avocat', calories: 160, protein: 2, carbs: 9, fat: 15, category: 'Fruits', unit: '100g' } },
  { keywords: ['pain', 'bread'], food: { name: 'Pain complet', calories: 247, protein: 13, carbs: 41, fat: 4.2, category: 'Féculents', unit: '100g' } },
  { keywords: ['tomate', 'tomato'], food: { name: 'Tomates', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: 'Légumes', unit: '100g' } },
  { keywords: ['salade', 'salad'], food: { name: 'Salade verte', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, category: 'Légumes', unit: '100g' } },
  { keywords: ['banane', 'banana'], food: { name: 'Banane', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, vitaminC: 15, category: 'Fruits', unit: '100g' } },
  { keywords: ['kiwi jaune', 'kiwi gold', 'kiwi', 'sungold'], food: { name: 'Kiwi jaune', calories: 60, protein: 1.1, carbs: 15, fat: 0.5, fiber: 2, vitaminC: 140, category: 'Fruits', unit: '100g' } },
  { keywords: ['pomme', 'apple'], food: { name: 'Pomme', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, vitaminC: 7, category: 'Fruits', unit: '100g' } },
  { keywords: ['yaourt', 'yogurt'], food: { name: 'Yaourt nature 0%', calories: 56, protein: 10, carbs: 4, fat: 0.1, category: 'Produits laitiers', unit: '100g' } },
  { keywords: ['fromage', 'cheese'], food: { name: 'Fromage', calories: 280, protein: 22, carbs: 2.2, fat: 22, category: 'Produits laitiers', unit: '100g' } },
  { keywords: ['bœuf', 'beef'], food: { name: 'Bœuf haché 5%', calories: 137, protein: 20, carbs: 0, fat: 5, category: 'Protéines', unit: '100g' } },
  { keywords: ['saumon', 'salmon'], food: { name: 'Saumon', calories: 208, protein: 22, carbs: 0, fat: 13, category: 'Protéines', unit: '100g' } },
  { keywords: ['brocoli', 'broccoli'], food: { name: 'Brocolis', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, category: 'Légumes', unit: '100g' } },
  { keywords: ['farine', 'flour'], food: { name: 'Farine de blé', calories: 364, protein: 10, carbs: 76, fat: 1, category: 'Féculents', unit: '100g' } }
];
