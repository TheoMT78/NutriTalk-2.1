import React, { useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import { Recipe } from '../types';
import DeleteRecipeSheet from './DeleteRecipeSheet';

interface Props {
  recipe: Recipe;
  onAdd?: (r: Recipe) => void;
  onSelect?: (r: Recipe) => void;
  onDelete?: (r: Recipe) => void;
}

const parseTime = (val?: string): number => {
  if (!val) return 0;
  const h = parseInt(val.match(/(\d+)h/)?.[1] || '0', 10);
  const m = parseInt(val.match(/(\d+)\s*min/)?.[1] || '0', 10);
  return h * 60 + m;
};

const RecipeCard: React.FC<Props> = ({ recipe, onAdd, onSelect, onDelete }) => {
  const totalTime = parseTime(recipe.prepTime) + parseTime(recipe.cookTime);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="rounded-2xl bg-[#242C3B] shadow-lg p-4 mb-4 transition hover:scale-105 cursor-pointer"
      onClick={() => onSelect && onSelect(recipe)}
    >
      {recipe.image ? (
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-32 object-cover rounded-lg mb-2"
        />
      ) : (
        <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center mb-2 text-gray-300 text-sm">
          Image manquante
        </div>
      )}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white font-bold text-lg">{recipe.name}</h3>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {onAdd && (
            <button
              onClick={() => onAdd(recipe)}
              className="bg-green-500 rounded-full px-3 py-1 text-white font-semibold flex items-center justify-center"
              aria-label="Ajouter la recette"
            >
              <Plus size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => setShowMenu(true)}
              className="p-1 text-gray-400 hover:text-white"
              aria-label="Options"
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      </div>
      {(totalTime || recipe.servings) && (
        <div className="flex items-center text-gray-300 text-xs gap-4 my-1">
          {totalTime > 0 && <span>⏱️ {totalTime} min</span>}
          <span>👤 {recipe.servings ?? 1} pers.</span>
        </div>
      )}
      {(recipe.calories || recipe.carbs || recipe.protein || recipe.fat) && (
        <div className="flex gap-2 mb-2">
          {recipe.calories !== undefined && (
            <span className="bg-blue-700 text-white rounded px-2 py-1 text-xs font-bold">
              {recipe.calories} kcal
            </span>
          )}
          {recipe.carbs !== undefined && (
            <span className="bg-orange-400 text-white rounded px-2 py-1 text-xs font-bold">
              {recipe.carbs}g gluc
            </span>
          )}
          {recipe.protein !== undefined && (
            <span className="bg-green-500 text-white rounded px-2 py-1 text-xs font-bold">
              {recipe.protein}g prot
            </span>
          )}
          {recipe.fat !== undefined && (
            <span className="bg-violet-600 text-white rounded px-2 py-1 text-xs font-bold">
              {recipe.fat}g lip
            </span>
          )}
        </div>
      )}
      {onDelete && (
        <DeleteRecipeSheet
          show={showMenu}
          onClose={() => setShowMenu(false)}
          onDelete={() => onDelete(recipe)}
        />
      )}
    </div>
  );
};

export default RecipeCard;
