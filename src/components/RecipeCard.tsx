import React from 'react';
import { Plus } from 'lucide-react';
import { Recipe } from '../types';

interface Props {
  recipe: Recipe;
  onAdd?: (r: Recipe) => void;
  onSelect?: (r: Recipe) => void;
}

const RecipeCard: React.FC<Props> = ({ recipe, onAdd, onSelect }) => {
  return (
    <div
      className="rounded-2xl bg-[#242C3B] shadow-lg p-4 mb-4 transition hover:scale-105 cursor-pointer"
      onClick={() => onSelect && onSelect(recipe)}
    >
      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-40 object-cover rounded-xl mb-2"
        />
      )}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white font-bold text-lg">{recipe.name}</h3>
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(recipe);
            }}
            className="bg-green-500 rounded-full px-3 py-1 text-white font-semibold flex items-center justify-center"
            aria-label="Ajouter la recette"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {(recipe.prepTime || recipe.servings) && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          {recipe.prepTime && <span>⏰ {recipe.prepTime}</span>}
          {recipe.servings && <span>👥 {recipe.servings} pers.</span>}
        </div>
      )}
      {(recipe.calories || recipe.protein || recipe.carbs || recipe.fat) && (
        <div className="flex gap-2 mb-1">
          {recipe.calories !== undefined && (
            <span className="bg-blue-700 text-white rounded-lg px-2 py-1 text-xs font-bold">
              {recipe.calories} kcal
            </span>
          )}
          {recipe.protein !== undefined && (
            <span className="bg-green-700 text-white rounded-lg px-2 py-1 text-xs font-bold">
              {recipe.protein}g prot
            </span>
          )}
          {recipe.carbs !== undefined && (
            <span className="bg-orange-500 text-white rounded-lg px-2 py-1 text-xs font-bold">
              {recipe.carbs}g gluc
            </span>
          )}
          {recipe.fat !== undefined && (
            <span className="bg-purple-700 text-white rounded-lg px-2 py-1 text-xs font-bold">
              {recipe.fat}g lip
            </span>
          )}
        </div>
      )}
      {recipe.ingredients.length > 0 && (
        <div className="text-sm text-gray-300 truncate">
          {recipe.ingredients.join(', ')}
        </div>
      )}
    </div>
  );
};

export default RecipeCard;
