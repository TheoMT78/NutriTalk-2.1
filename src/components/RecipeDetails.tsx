import React, { useState, useRef, useLayoutEffect } from 'react';
import { X, Pencil, Minus, Plus, ChevronDown } from 'lucide-react';
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

const parseIng = (
  ing: string,
  factor: number,
  unitMode: 'original' | 'metric' | 'imperial' = 'original'
) => {
  const m = ing.match(/^(\d+(?:\.\d+)?)(\s*(kg|g|ml|cl|l|oz|lb|fl\s?oz|cup)s?\b)?\s*(.*)/i);
  if (m) {
    let qty = parseFloat(m[1]) * factor;
    let unit = (m[3] || '').toLowerCase();
    const rest = m[4].trim();

    const toImperial = (q:number,u:string):[number,string] => {
      switch(u){
        case 'g': return [q/28.35,'oz'];
        case 'kg': return [q*1000/453.592,'lb'];
        case 'ml': return [q/29.5735,'fl oz'];
        case 'l': return [q*1000/240,'cup'];
        default: return [q,u];
      }
    };
    const toMetric = (q:number,u:string):[number,string] => {
      switch(u){
        case 'oz': return [q*28.35,'g'];
        case 'lb': return [q*453.592,'g'];
        case 'fl oz': return [q*29.5735,'ml'];
        case 'cup': return [q*240,'ml'];
        default: return [q,u];
      }
    };

    if(unitMode==='imperial'){
      [qty, unit] = toImperial(qty, unit);
    } else if(unitMode==='metric' && unit){
      [qty, unit] = toMetric(qty, unit);
      if(unit==='g' && qty>=1000){ qty/=1000; unit='kg'; }
      if(unit==='ml' && qty>=1000){ qty/=1000; unit='l'; }
    }

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
  const [unitMode, setUnitMode] = useState<'original' | 'metric' | 'imperial'>('original');
  const [showUnitMenu, setShowUnitMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScroll = useRef(0);
  const factor = servings / (recipe.servings || 1);
  const ingredientsList = Array.isArray(recipe.ingredients) ? recipe.ingredients : recipe.ingredients ? [recipe.ingredients as any] : [];
  const instructionList = Array.isArray(recipe.instructions) ? recipe.instructions : recipe.instructions ? [recipe.instructions as any] : [];
  const parseTime = (val?: string) => {
    if (!val) return 0;
    const h = parseInt(val.match(/(\d+)h/)?.[1] || '0', 10);
    const m = parseInt(val.match(/(\d+)\s*min/)?.[1] || '0', 10);
    return h * 60 + m;
  };
  const totalTime = parseTime(recipe.prepTime) + parseTime(recipe.cookTime);
  const calories = recipe.calories ? Math.round(recipe.calories * factor) : undefined;

  const changeTab = (t: 'ingredients' | 'steps' | 'score') => {
    if (scrollRef.current) lastScroll.current = scrollRef.current.scrollTop;
    setTab(t);
  };

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = lastScroll.current;
  }, [tab]);
  return (
    <div className="fixed inset-0 bg-black/80 overflow-y-auto z-50" ref={scrollRef}>
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
          <button
            className={`pb-2 flex-1 ${tab==='ingredients'? 'border-b-2 border-blue-500 text-white':'text-gray-400'}`}
            onClick={() => changeTab('ingredients')}
          >
            Ingrédients
          </button>
          <button
            className={`pb-2 flex-1 ${tab==='steps'? 'border-b-2 border-blue-500 text-white':'text-gray-400'}`}
            onClick={() => changeTab('steps')}
          >
            Instructions
          </button>
          <button
            className={`pb-2 flex-1 ${tab==='score'? 'border-b-2 border-blue-500 text-white':'text-gray-400'}`}
            onClick={() => changeTab('score')}
          >
            Score santé
          </button>
        </div>
        {tab === 'ingredients' && (
          <div className="space-y-2">
            {recipe.description && (
              <p className="text-gray-300 text-sm break-words">{recipe.description}</p>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setServings(s => Math.max(1, s - 1))} className="p-2 bg-gray-700 rounded" aria-label="Diminuer">
                  <Minus size={16} />
                </button>
                <span className="text-white">{servings} pers.</span>
                <button onClick={() => setServings(s => s + 1)} className="p-2 bg-gray-700 rounded" aria-label="Augmenter">
                  <Plus size={16} />
                </button>
              </div>
              <div className="relative">
                <button onClick={() => setShowUnitMenu(m => !m)} className="text-blue-400 flex items-center gap-1">
                  Convertir les unités <ChevronDown size={16} />
                </button>
                {showUnitMenu && (
                  <div className="absolute right-0 mt-1 bg-[#222B3A] rounded shadow z-10">
                    {['original','metric','imperial'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => {setUnitMode(opt as any); setShowUnitMenu(false);}}
                        className={`block px-4 py-1 text-left w-full ${unitMode===opt?'bg-blue-600 text-white':'text-gray-200'}`}
                      >
                        {opt==='original'?'Original':opt==='metric'?'Métrique':'Impérial'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <ul className="space-y-1 pt-2">
              {ingredientsList.map((ing, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span>{getEmoji(ing)}</span>
                  <span className="break-words whitespace-pre-line flex-1">{parseIng(ing, factor, unitMode)}</span>
                </li>
              ))}
            </ul>
            <button className="w-full mt-2 py-2 bg-blue-600 rounded text-white">Ajouter à la liste de courses</button>
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
              {instructionList.map((step, i) => (
                <li key={i} className="break-words whitespace-pre-line border-b border-gray-700 pb-2">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
        {tab === 'score' && (
          <div className="space-y-2 text-sm text-gray-300">
            <table className="w-full text-left">
              <tbody>
                {recipe.calories !== undefined && (
                  <tr>
                    <th className="pr-4 font-normal">Calories</th>
                    <td>{Math.round((recipe.calories || 0) / (recipe.servings || 1))} kcal</td>
                  </tr>
                )}
                {recipe.carbs !== undefined && (
                  <tr>
                    <th className="pr-4 font-normal">Glucides</th>
                    <td>{Math.round((recipe.carbs || 0) / (recipe.servings || 1))} g</td>
                  </tr>
                )}
                {recipe.protein !== undefined && (
                  <tr>
                    <th className="pr-4 font-normal">Protéines</th>
                    <td>{Math.round((recipe.protein || 0) / (recipe.servings || 1))} g</td>
                  </tr>
                )}
                {recipe.fat !== undefined && (
                  <tr>
                    <th className="pr-4 font-normal">Lipides</th>
                    <td>{Math.round((recipe.fat || 0) / (recipe.servings || 1))} g</td>
                  </tr>
                )}
                {recipe.fiber !== undefined && (
                  <tr>
                    <th className="pr-4 font-normal">Fibres</th>
                    <td>{Math.round((recipe.fiber || 0) / (recipe.servings || 1))} g</td>
                  </tr>
                )}
                {recipe.sugars !== undefined && (
                  <tr>
                    <th className="pr-4 font-normal">Sucres</th>
                    <td>{Math.round((recipe.sugars || 0) / (recipe.servings || 1))} g</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetails;
