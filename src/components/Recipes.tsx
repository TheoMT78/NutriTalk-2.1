import React, { useState } from 'react';
import { Plus, Search as SearchIcon } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Recipe } from '../types';
import RecipeCard from './RecipeCard';
import RecipeForm from './RecipeForm';
import RecipeDetails from './RecipeDetails';

const defaultRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Salade quinoa avocat',
    description: 'Un plat frais et complet',
    image:
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    categories: ['Déjeuner'],
    prepTime: '20 min',
    cookTime: '0 min',
    servings: 2,
    calories: 420,
    protein: 18,
    carbs: 65,
    fat: 12,
    ingredients: ['200g quinoa', '1 avocat', 'tomates', "huile d'olive"],
    instructions: [
      'Cuire le quinoa',
      "Mélanger avec les légumes et l'huile"
    ]
  }
];

const catOptions = ['Toutes', 'Petit-déj', 'Déjeuner', 'Dîner', 'Collation'];

const Recipes: React.FC = () => {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('nutritalk-recipes', defaultRecipes);

  const normalizeRecipe = (r: any): Recipe => ({
    ...r,
    ingredients: Array.isArray(r.ingredients)
      ? r.ingredients
      : r.ingredients
      ? [r.ingredients]
      : [],
    instructions: Array.isArray(r.instructions)
      ? r.instructions
      : r.instructions
      ? [r.instructions]
      : []
  });

  const normRecipes = recipes.map(normalizeRecipe);
  const [search, setSearch] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [reopenId, setReopenId] = useState<string | null>(null);

  const toggleCat = (c: string) => {
    if (c === 'Toutes') {
      setCats([]);
    } else {
      setCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    }
  };

  const filtered = normRecipes.filter(r => {
    const matchName = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = cats.length === 0 || r.categories?.some(c => cats.includes(c));
    return matchName && matchCat;
  });

  const addRecipe = (r: Recipe) => {
    setRecipes([...recipes, r]);
  };

  const saveRecipe = (r: Recipe) => {
    setRecipes(prev => {
      const idx = prev.findIndex(x => x.id === r.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = r;
        return copy;
      }
      return [...prev, r];
    });
    if (reopenId === r.id) {
      setSelected(r);
      setReopenId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recettes</h2>
          <p className="text-sm text-gray-400">Découvre des plats sains et délicieux</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
          aria-label="Ajouter une recette"
        >
          <Plus />
        </button>
      </div>
      <div className="bg-[#222B3A] rounded-2xl p-4 shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une recette..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {catOptions.map(c => (
            <button
              key={c}
              onClick={() => toggleCat(c)}
              className={`px-3 py-1 rounded-lg text-sm ${
                (c === 'Toutes' && cats.length === 0) || cats.includes(c)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {filtered.map(r => (
          <RecipeCard key={r.id} recipe={r} onSelect={() => setSelected(r)} />
        ))}
      </div>
      {showForm && (
        <RecipeForm onSave={addRecipe} onClose={() => setShowForm(false)} />
      )}
      {editing && (
        <RecipeForm
          onSave={saveRecipe}
          initialRecipe={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {selected && (
        <RecipeDetails
          recipe={selected}
          onClose={() => setSelected(null)}
          onEdit={(r) => {
            setEditing(r);
            setReopenId(r.id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
};

export default Recipes;
