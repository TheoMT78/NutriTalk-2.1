import React, { useState, useEffect, useMemo } from 'react';
import { Search, Star, X } from 'lucide-react';
import FoodSearchHeader from './FoodSearchHeader';
import { FoodItem } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import QRScanner from './QRScanner';
import { OFFProduct, searchProductFallback } from '../utils/openFoodFacts';
import FoodDetailModal from './FoodDetailModal';
import Fuse from 'fuse.js';
import { normalizeFoodName } from '../utils/normalizeFoodName';

interface FoodSearchProps {
  onAddFood: (food: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    category: string;
    meal: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
  }) => void;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onAddFood }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation'>('déjeuner');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [detailFood, setDetailFood] = useState<FoodItem | null>(null);
  const [favorites, setFavorites] = useLocalStorage<string[]>('nutritalk-favorites', []);
  const [customFoods, setCustomFoods] = useLocalStorage<FoodItem[]>('nutritalk-custom-foods', []);
  const [externalFoods, setExternalFoods] = useState<FoodItem[]>([]);

  // Extended food database
  const [foods] = useState<FoodItem[]>([
    // Starches
    { id: '1', name: 'Riz blanc cuit', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, category: 'Féculents', unit: '100g' },
    { id: '1b', name: 'Riz blanc cru', calories: 360, protein: 7, carbs: 80, fat: 0.6, category: 'Féculents', unit: '100g' },
    { id: '2', name: 'Pâtes cuites', calories: 131, protein: 5, carbs: 25, fat: 1.1, category: 'Féculents', unit: '100g' },
    { id: '2b', name: 'Pâtes crues', calories: 371, protein: 13, carbs: 75, fat: 1.5, category: 'Féculents', unit: '100g' },
    { id: '3', name: 'Pommes de terre', calories: 77, protein: 2, carbs: 17, fat: 0.1, category: 'Féculents', unit: '100g' },
    { id: '3b', name: 'Patate douce', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, category: 'Féculents', unit: '100g' },
    { id: '4', name: 'Quinoa cuit', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, category: 'Féculents', unit: '100g' },
    { id: '5', name: 'Pain complet', calories: 247, protein: 13, carbs: 41, fat: 4.2, category: 'Féculents', unit: '100g' },
    { id: '29', name: 'Pois chiches cuits', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, category: 'Légumineuses', unit: '100g' },
    
    // Proteins
    { id: '6', name: 'Blanc de poulet', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Protéines', unit: '100g' },
    { id: '7', name: 'Saumon', calories: 208, protein: 22, carbs: 0, fat: 13, category: 'Protéines', unit: '100g' },
    { id: '8', name: 'Bœuf haché 5%', calories: 137, protein: 20, carbs: 0, fat: 5, category: 'Protéines', unit: '100g' },
    { id: '9', name: 'Œufs', calories: 155, protein: 13, carbs: 1.1, fat: 11, category: 'Protéines', unit: '100g' },
    { id: '10', name: 'Thon en conserve', calories: 128, protein: 28, carbs: 0, fat: 1, category: 'Protéines', unit: '100g' },
    
    // Vegetables
    { id: '11', name: 'Brocolis', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, category: 'Légumes', unit: '100g' },
    { id: '12', name: 'Épinards', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'Légumes', unit: '100g' },
    { id: '13', name: 'Tomates', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: 'Légumes', unit: '100g' },
    { id: '14', name: 'Carottes', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, category: 'Légumes', unit: '100g' },
    { id: '15', name: 'Courgettes', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, category: 'Légumes', unit: '100g' },
    
    // Fruits
    { id: '16', name: 'Banane', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, vitaminC: 15, category: 'Fruits', unit: '100g' },
    { id: '17', name: 'Pomme', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, vitaminC: 7, category: 'Fruits', unit: '100g' },
    { id: '18', name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, vitaminC: 89, category: 'Fruits', unit: '100g' },
    { id: '19', name: 'Avocat', calories: 160, protein: 2, carbs: 9, fat: 15, category: 'Fruits', unit: '100g' },
    { id: '20', name: 'Fraises', calories: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2, vitaminC: 59, category: 'Fruits', unit: '100g' },
    { id: '20b', name: 'Kiwi jaune', calories: 60, protein: 1.1, carbs: 15, fat: 0.5, fiber: 2, vitaminC: 140, category: 'Fruits', unit: '100g' },
    
    // Dairy products
    { id: '21', name: 'Yaourt nature 0%', calories: 56, protein: 10, carbs: 4, fat: 0.1, category: 'Produits laitiers', unit: '100g' },
    { id: '22', name: 'Fromage blanc 0%', calories: 47, protein: 8, carbs: 4, fat: 0.2, category: 'Produits laitiers', unit: '100g' },
    { id: '23', name: 'Lait écrémé', calories: 35, protein: 3.4, carbs: 5, fat: 0.1, category: 'Produits laitiers', unit: '100ml' },
    { id: '24', name: 'Mozzarella', calories: 280, protein: 22, carbs: 2.2, fat: 22, category: 'Produits laitiers', unit: '100g' },
    
    // Snacks and others
    { id: '25', name: 'Amandes', calories: 579, protein: 21, carbs: 22, fat: 50, category: 'Fruits secs', unit: '100g' },
    { id: '26', name: 'Noix', calories: 654, protein: 15, carbs: 14, fat: 65, category: 'Fruits secs', unit: '100g' },
    { id: '27', name: 'Huile d\'olive', calories: 884, protein: 0, carbs: 0, fat: 100, category: 'Matières grasses', unit: '100ml' },
    { id: '28', name: 'Chocolat noir 70%', calories: 546, protein: 8, carbs: 46, fat: 31, category: 'Snacks', unit: '100g' },
    { id: '30', name: 'Pignons de pin', calories: 673, protein: 14, carbs: 13, fat: 68, category: 'Fruits secs', unit: '100g' },
    { id: '31', name: 'Pois cassés', calories: 118, protein: 8, carbs: 21, fat: 0.4, category: 'Légumineuses', unit: '100g' },
    { id: '32', name: 'Chou kale', calories: 49, protein: 4.3, carbs: 9, fat: 0.9, category: 'Légumes', unit: '100g' },
  ]);

  const allFoods = [...foods, ...customFoods, ...externalFoods];

  const normalizedFoods = useMemo(
    () =>
      allFoods.map((f) => ({ ...f, _norm: normalizeFoodName(f.name) })),
    [allFoods]
  );

  const fuse = useMemo(
    () => new Fuse(normalizedFoods, { keys: ['_norm'], threshold: 0.3 }),
    [normalizedFoods]
  );

  const searchResults = useMemo(() => {
    if (!searchTerm) return normalizedFoods;
    const results = fuse.search(normalizeFoodName(searchTerm));
    return results.map((r) => r.item);
  }, [searchTerm, fuse, normalizedFoods]);

  const filteredFoods = searchResults.filter((food) => {
    const matchesCategory = selectedCategory ? food.category === selectedCategory : true;
    const matchesFavorites = showFavorites ? favorites.includes(food.id) : true;
    return matchesCategory && matchesFavorites;
  });

  useEffect(() => {
    const fetchExternal = async () => {
      if (!searchTerm) {
        setExternalFoods([]);
        return;
      }
      if (filteredFoods.length > 0) return;
      const results = await searchProductFallback(searchTerm);
      const mapped: FoodItem[] = results.slice(0, 5).map(p => ({
        id: p.code,
        name: p.product_name || 'Produit',
        brand: (p as any).brands || undefined,
        calories: p.nutriments?.['energy-kcal_100g'] || 0,
        protein: p.nutriments?.proteins_100g || 0,
        carbs: p.nutriments?.carbohydrates_100g || 0,
        fat: p.nutriments?.fat_100g || 0,
        fiber: p.nutriments?.fiber_100g || 0,
        vitaminA: p.nutriments?.['vitamin-a_100g'] || 0,
        vitaminC: p.nutriments?.['vitamin-c_100g'] || 0,
        calcium: p.nutriments?.['calcium_100g'] || 0,
        iron: p.nutriments?.['iron_100g'] || 0,
        category: 'Importé',
        unit: '100g',
        isCustom: true,
      }));
      setExternalFoods(mapped);
    };
    fetchExternal();
  }, [searchTerm, filteredFoods.length]);

  const categories = [...new Set(allFoods.map(food => food.category))];

  const [newFood, setNewFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    category: '',
    unit: '100g'
  });

  const handleAddFood = (food: FoodItem) => {
    const quantity = parseFloat(food.unit) || 1;
    const multiplier = quantity / (parseFloat(food.unit) || quantity);
    
  onAddFood({
      name: food.name,
      quantity,
      unit: food.unit,
      calories: food.calories * multiplier,
      protein: food.protein * multiplier,
      carbs: food.carbs * multiplier,
      fat: food.fat * multiplier,
      fiber: (food.fiber || 0) * multiplier,
      vitaminA: (food.vitaminA || 0) * multiplier,
      vitaminC: (food.vitaminC || 0) * multiplier,
      calcium: (food.calcium || 0) * multiplier,
      iron: (food.iron || 0) * multiplier,
      category: food.category,
      meal: selectedMeal
    });

  };

  const toggleFavorite = (foodId: string) => {
    setFavorites(prev => 
      prev.includes(foodId) 
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId]
    );
  };

  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFood.name || !newFood.calories) return;

    const customFood: FoodItem = {
      id: Date.now().toString(),
      name: newFood.name,
      calories: parseFloat(newFood.calories),
      protein: parseFloat(newFood.protein) || 0,
      carbs: parseFloat(newFood.carbs) || 0,
      fat: parseFloat(newFood.fat) || 0,
      category: newFood.category || 'Personnalisé',
      unit: newFood.unit,
      isCustom: true
    };

    setCustomFoods(prev => [...prev, customFood]);
    setNewFood({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      category: '',
      unit: '100g'
    });
    setShowAddForm(false);
  };

  const handleScanResult = (p: OFFProduct) => {
    const item: FoodItem = {
      id: p.code,
      name: p.product_name || 'Produit',
      brand: (p as any).brands || undefined,
      calories: p.nutriments?.['energy-kcal_100g'] || 0,
      protein: p.nutriments?.proteins_100g || 0,
      carbs: p.nutriments?.carbohydrates_100g || 0,
      fat: p.nutriments?.fat_100g || 0,
      fiber: p.nutriments?.fiber_100g || 0,
      vitaminA: p.nutriments?.['vitamin-a_100g'] || 0,
      vitaminC: p.nutriments?.['vitamin-c_100g'] || 0,
      calcium: p.nutriments?.['calcium_100g'] || 0,
      iron: p.nutriments?.['iron_100g'] || 0,
      category: 'Importé',
      unit: '100g',
      isCustom: true
    };

    setCustomFoods(prev =>
      prev.some(f => f.id === item.id) ? prev : [...prev, item]
    );

    alert(`${item.name} ajouté à vos aliments personnalisés`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <FoodSearchHeader
        onScan={() => setShowScanner(true)}
        onAdd={() => setShowAddForm(true)}
      />

      {/* Sélection du repas */}
      <div className="bg-[#222B3A] rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4">Repas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['petit-déjeuner', 'déjeuner', 'dîner', 'collation'] as const).map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                selectedMeal === meal
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-[#222B3A] rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un aliment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            />
          </div>

          {/* Catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Favoris */}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              showFavorites
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Star size={20} />
            <span>Favoris</span>
          </button>
        </div>
      </div>

      {/* Liste des aliments */}
      <div className="bg-[#222B3A] rounded-2xl shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Aliments</h3>
          
          {filteredFoods.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun aliment trouvé pour votre recherche
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFoods.map((food) => {
                const fav = favorites.includes(food.id);
                return (
                  <div
                    key={food.id}
                    className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                    style={{ backgroundColor: '#434B59' }}
                    onClick={() => setDetailFood(food)}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-white text-base">{food.name}</span>
                      <span className="text-gray-400 text-sm mt-0.5">
                        {food.calories} cal, {food.unit}
                        {food.brand ? `, ${food.brand}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center ml-4 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fav) {
                            setFavorites(favorites.filter(id => id !== food.id));
                          } else {
                            setFavorites([...favorites, food.id]);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center text-yellow-400"
                        aria-label="Favori"
                      >
                        <Star size={20} fill={fav ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddFood(food);
                        }}
                        className="w-9 h-9 rounded-full bg-blue-600 text-white text-lg flex items-center justify-center"
                        aria-label="Ajouter rapidement"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
         )}
        </div>
      </div>

      {/* Formulaire d'ajout d'aliment personnalisé */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#222B3A] rounded-2xl p-6 w-full max-w-md shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ajouter un aliment personnalisé</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomFood} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de l'aliment</label>
                <input
                  type="text"
                  value={newFood.name}
                  onChange={(e) => setNewFood(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Calories</label>
                  <input
                    type="number"
                    value={newFood.calories}
                    onChange={(e) => setNewFood(prev => ({ ...prev, calories: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Unité</label>
                  <select
                    value={newFood.unit}
                    onChange={(e) => setNewFood(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                  >
                    <option value="100g">100g</option>
                    <option value="100ml">100ml</option>
                    <option value="1 portion">1 portion</option>
                    <option value="1 pièce">1 pièce</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Protéines (g)</label>
                  <input
                    type="number"
                    value={newFood.protein}
                    onChange={(e) => setNewFood(prev => ({ ...prev, protein: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Glucides (g)</label>
                  <input
                    type="number"
                    value={newFood.carbs}
                    onChange={(e) => setNewFood(prev => ({ ...prev, carbs: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Lipides (g)</label>
                  <input
                    type="number"
                    value={newFood.fat}
                    onChange={(e) => setNewFood(prev => ({ ...prev, fat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <input
                  type="text"
                  value={newFood.category}
                  onChange={(e) => setNewFood(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                  placeholder="Ex: Personnalisé"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showScanner && (
        <QRScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />
      )}
      {detailFood && (
        <FoodDetailModal
          food={detailFood}
          meal={selectedMeal}
          onAdd={(entry) => {
            onAddFood(entry);
            setDetailFood(null);
          }}
          onClose={() => setDetailFood(null)}
        />
      )}
    </div>
  );
};

export default FoodSearch;