import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Recipe } from '../types';

interface Props {
  onAdd: (r: Recipe) => void;
  onClose: () => void;
}

const categories = ['Petit-déj', 'Déjeuner', 'Dîner', 'Collation'];

const RecipeForm: React.FC<Props> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');

  const toggleCat = (c: string) => {
    setSelected(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe: Recipe = {
      id: Date.now().toString(),
      name,
      image: image || undefined,
      categories: selected,
      prepTime: prepTime || undefined,
      servings: servings ? parseInt(servings, 10) : undefined,
      calories: calories ? parseFloat(calories) : undefined,
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fat: fat ? parseFloat(fat) : undefined,
      ingredients: ingredients.split('\n').map(s => s.trim()).filter(Boolean),
      instructions,
    };
    onAdd(recipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#222B3A] rounded-2xl p-6 w-full max-w-md shadow-md overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ajouter une recette</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image (URL)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              value={image}
              onChange={e => setImage(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => toggleCat(c)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selected.includes(c)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Préparation</label>
              <input
                type="text"
                value={prepTime}
                onChange={e => setPrepTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Portions</label>
              <input
                type="number"
                value={servings}
                onChange={e => setServings(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                min="1"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">kcal</label>
              <input
                type="number"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Prot (g)</label>
              <input
                type="number"
                value={protein}
                onChange={e => setProtein(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Gluc (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={e => setCarbs(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Lip (g)</label>
              <input
                type="number"
                value={fat}
                onChange={e => setFat(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                min="0"
                step="0.1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ingrédients (une ligne par ingrédient)</label>
            <textarea
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instructions</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
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
  );
};

export default RecipeForm;
