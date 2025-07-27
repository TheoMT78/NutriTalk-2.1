export interface BasicFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const basicFoods: BasicFood[] = [
  { name: 'Riz blanc cuit', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Riz blanc cru', calories: 360, protein: 7, carbs: 80, fat: 0.6 },
  { name: 'Pâtes cuites', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: 'Pâtes crues', calories: 371, protein: 13, carbs: 75, fat: 1.5 },
  { name: 'Pommes de terre', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { name: 'Patate douce', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: 'Quinoa cuit', calories: 120, protein: 4.4, carbs: 22, fat: 1.9 },
  { name: 'Pain complet', calories: 247, protein: 13, carbs: 41, fat: 4.2 },
  { name: 'Pois chiches cuits', calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  { name: 'Blanc de poulet', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Saumon', calories: 208, protein: 22, carbs: 0, fat: 13 },
  { name: 'Bœuf haché 5%', calories: 137, protein: 20, carbs: 0, fat: 5 },
  { name: 'Œufs', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: 'Thon en conserve', calories: 128, protein: 28, carbs: 0, fat: 1 },
  { name: 'Brocolis', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'Épinards', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: 'Tomates', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Carottes', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: 'Courgettes', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { name: 'Banane', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'Pomme', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { name: 'Avocat', calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: 'Fraises', calories: 32, protein: 0.7, carbs: 8, fat: 0.3 },
  { name: 'Yaourt nature 0%', calories: 56, protein: 10, carbs: 4, fat: 0.1 },
  { name: 'Fromage blanc 0%', calories: 47, protein: 8, carbs: 4, fat: 0.2 },
  { name: 'Lait écrémé', calories: 35, protein: 3.4, carbs: 5, fat: 0.1 },
  { name: 'Mozzarella', calories: 280, protein: 22, carbs: 2.2, fat: 22 },
  { name: 'Amandes', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: 'Noix', calories: 654, protein: 15, carbs: 14, fat: 65 },
  { name: 'Huile d\'olive', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Chocolat noir 70%', calories: 546, protein: 8, carbs: 46, fat: 31 },
];
