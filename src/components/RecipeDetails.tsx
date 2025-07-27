import React, { useState } from 'react';
import { X, Pencil, Minus, Plus } from 'lucide-react';
import { Recipe } from '../types';

const ingredientEmojis: Record<string, string> = {
  banane: '🍌',
  oeuf: '🥚',
  oeufs: '🥚',
  riz: '🍚',
  pate: '🍝',
  pâtes: '🍝',
  tomate: '🍅',
  poulet: '🍗',
  carotte: '🥕',
  oignon: '🧅',
  lait: '🥛',
  beurre: '🧈',
  sucre: '🍬',
  farine: '🌾'
};

const getEmoji = (name: string) => {
  const key = Object.keys(ingredientEmojis).find(k =>
    name.toLowerCase().includes(k)
  );
  return key ? ingredientEmojis[key] : '🥄';
};

const parseIng = (ing: string, factor: number) => {
  const m = ing.match(/^(\d+(?:\.\d+)?)(\s*(?:kg|g|ml|cl|l)?)(.*)/i);
  if (m) {
    const qty = parseFloat(m[1]) * factor;
    const unit = m[2] || '';
    const rest = m[3].trim();
    return (
      <>
        <b>{Math.round(qty * 100) / 100}{unit}</b> {rest}
      </>
    );
  }
  return ing;
};

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onEdit: (r: Recipe) => void;
}

const RecipeDetails: React.FC<Props> = ({ recipe, onClose, onEdit }) => {
  const [tab, setTab] = useState<'ingredients' | 'steps' | 'score'>('ingredients');
  const [servings, setServings] = useState(recipe.servings || 1);
  const factor = servings / (recipe.servings || 1);
  const parseTime = (val?: string) => {
    if (!val) return 0;
    const h = parseInt(val.match(/(\d+)h/)?.[1] || '0', 10);
    const m = parseInt(val.match(/(\d+)\s*min/)?.[1] || '0', 10);
    return h * 60 + m;
  };
  const totalTime = parseTime(recipe.prepTime) + parseTime(recipe.cookTime);
  const calories = recipe.calories ? Math.round(recipe.calories * factor) : undefined;
  return (
    <div className="fixed inset-0 bg-black/80 overflow-y-auto z-50">
      <div className="bg-[#181D24] min-h-screen p-4 pb-10 space-y-4">
        <div className="flex justify-between items-center">
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 p-2">
            <X />
          </button>
          <h2 className="text-xl font-bold flex-1 text-center">{recipe.name}</h2>
          <button onClick={() => onEdit(recipe)} aria-label="Modifier" className="text-gray-400 p-2">
            <Pencil />
          </button>
        </div>
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.name} className="w-full h-40 object-cover rounded-lg" />
        ) : (
          <div className="w-full h-40 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 text-sm">
            Image manquante
          </div>
        )}
        {(totalTime || servings || calories) && (
          <div className="flex gap-4 text-gray-300 text-sm">
            {totalTime > 0 && <span>⏱️ {totalTime} min</span>}
            <span>👤 {servings} pers.</span>
            {calories !== undefined && <span>{calories} kcal</span>}
          </div>
        )}
        <div className="flex gap-4 border-b border-gray-700">
          <button className={`pb-2 flex-1 ${tab==='ingredients'? 'border-b-2 border-blue-500 text-white':'text-gray-400'}`} onClick={() => setTab('ingredients')}>Ingrédients</button>
          <button className={`pb-2 flex-1 ${tab==='steps'? 'border-b-2 border-blue-500 text-white':'text-gray-400'}`} onClick={() => setTab('steps')}>Instructions</button>
          <button className={`pb-2 flex-1 ${tab==='score'? 'border-b-2 border-blue-500 text-white':'text-gray-400'}`} onClick={() => setTab('score')}>Score santé</button>
        </div>
        {tab === 'ingredients' && (
          <div className="space-y-2">
            {recipe.description && <p className="text-gray-300 text-sm">{recipe.description}</p>}
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span>{getEmoji(ing)}</span>
                  <span className="break-words whitespace-pre-line flex-1">{parseIng(ing, factor)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-4 pt-4">
              <button onClick={() => setServings(s => Math.max(1, s - 1))} className="p-2 bg-gray-700 rounded" aria-label="Diminuer"> <Minus size={16}/> </button>
              <span className="text-white">{servings} pers.</span>
              <button onClick={() => setServings(s => s + 1)} className="p-2 bg-gray-700 rounded" aria-label="Augmenter"> <Plus size={16}/> </button>
            </div>
          </div>
        )}
        {tab === 'steps' && (
          <div className="space-y-2">
            {(recipe.prepTime || recipe.cookTime) && (
              <div className="text-gray-300 text-sm flex gap-4">
                {recipe.prepTime && <span>Préparation : {recipe.prepTime}</span>}
                {recipe.cookTime && <span>Cuisson : {recipe.cookTime}</span>}
              </div>
            )}
            <ol className="space-y-2 list-decimal list-inside">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="break-words whitespace-pre-line">{step}</li>
              ))}
            </ol>
          </div>
        )}
        {tab === 'score' && (
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex gap-2">
              {recipe.calories !== undefined && <span className="bg-blue-700 text-white rounded px-2 py-1 text-xs font-bold">{Math.round((recipe.calories || 0)/ (recipe.servings||1))} kcal</span>}
              {recipe.carbs !== undefined && <span className="bg-orange-400 text-white rounded px-2 py-1 text-xs font-bold">{Math.round((recipe.carbs ||0)/(recipe.servings||1))}g gluc</span>}
              {recipe.protein !== undefined && <span className="bg-green-500 text-white rounded px-2 py-1 text-xs font-bold">{Math.round((recipe.protein||0)/(recipe.servings||1))}g prot</span>}
              {recipe.fat !== undefined && <span className="bg-violet-600 text-white rounded px-2 py-1 text-xs font-bold">{Math.round((recipe.fat||0)/(recipe.servings||1))}g lip</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetails;
