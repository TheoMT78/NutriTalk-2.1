import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';

const parseList = (value: string): string[] => {
  return value
    .replace(/\r/g, '')
    .replace(/\s+(?=\d)/g, '\n')
    .replace(/(\d+\.)/g, '\n$1')
    .replace(/[;]+/g, '\n')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const formatTime = (h: number, m: number) => {
  if (!h && !m) return '0';
  const hours = h ? `${h}h` : '';
  const mins = `${m} min`;
  return hours ? `${hours} ${mins}` : mins;
};

const parseTime = (val: string): [number, number] => {
  const hMatch = val.match(/(\d+)h/);
  const mMatch = val.match(/(\d+)\s*min/);
  return [parseInt(hMatch?.[1] || '0', 10), parseInt(mMatch?.[1] || val, 10) || 0];
};
import { Recipe } from '../types';

interface Props {
  onAdd: (r: Recipe) => void;
  onClose: () => void;
}

const mealCategories = ['Petit-déj', 'Déjeuner', 'Dîner', 'Collation'];

const RecipeForm: React.FC<Props> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);
  const [servings, setServings] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [showPortion, setShowPortion] = useState(false);
  const [showPrep, setShowPrep] = useState(false);
  const [showCook, setShowCook] = useState(false);
  const [prepHours, setPrepHours] = useState(0);
  const [prepMinutes, setPrepMinutes] = useState(0);
  const [cookHours, setCookHours] = useState(0);
  const [cookMinutes, setCookMinutes] = useState(0);

  const toggleCategory = (c: string) => {
    setCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const addIngredient = () => setIngredients([...ingredients, '']);
  const updateIngredient = (i: number, v: string) => {
    const arr = [...ingredients];
    arr[i] = v;
    setIngredients(arr);
  };
  const handleIngredientBlur = (i: number) => {
    const items = parseList(ingredients[i]);
    if (items.length > 1) {
      const arr = [...ingredients];
      arr.splice(i, 1, ...items);
      setIngredients(arr);
    } else {
      const arr = [...ingredients];
      arr[i] = items[0] || '';
      setIngredients(arr);
    }
  };

  const addStep = () => setSteps([...steps, '']);
  const updateStep = (i: number, v: string) => {
    const arr = [...steps];
    arr[i] = v;
    setSteps(arr);
  };
  const handleStepBlur = (i: number) => {
    const items = parseList(steps[i]);
    if (items.length > 1) {
      const arr = [...steps];
      arr.splice(i, 1, ...items);
      setSteps(arr);
    } else {
      const arr = [...steps];
      arr[i] = items[0] || '';
      setSteps(arr);
    }
  };

  const openPortionModal = () => {
    setShowPortion(true);
  };

  const openPrepModal = () => {
    const [h, m] = parseTime(prepTime);
    setPrepHours(h);
    setPrepMinutes(m);
    setShowPrep(true);
  };

  const openCookModal = () => {
    const [h, m] = parseTime(cookTime);
    setCookHours(h);
    setCookMinutes(m);
    setShowCook(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe: Recipe = {
      id: Date.now().toString(),
      name,
      description: description || undefined,
      image: image || undefined,
      categories,
      ingredients: ingredients.filter(Boolean),
      instructions: steps.filter(Boolean),
      servings: servings ? parseInt(servings, 10) : undefined,
      prepTime: prepTime || '0',
      cookTime: cookTime || '0'
    };
    onAdd(recipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70">
      <div className="bg-[#181D24] min-h-screen px-4 pt-4 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 p-2"
              aria-label="Fermer"
            >
              <X />
            </button>
            <h2 className="text-white text-xl font-bold flex-1 text-center">
              Ajouter une recette
            </h2>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-full px-6 py-2 font-semibold"
            >
              Enregistrer
            </button>
          </div>

          <label
            htmlFor="cover"
            className="w-full bg-[#232832] rounded-xl py-6 flex flex-col items-center mb-5 border-2 border-dashed border-blue-600 text-blue-400 cursor-pointer"
          >
            {image ? (
              <img
                src={image}
                alt="aperçu"
                className="w-full h-40 object-cover rounded-lg"
              />
            ) : (
              <>
                <Camera className="mb-2" />
                Ajouter une photo de couverture
              </>
            )}
          </label>
          <input id="cover" type="file" accept="image/*" onChange={handleImage} className="hidden" />

          <input
            className="w-full rounded-lg bg-[#232832] text-white px-4 py-3 placeholder-gray-400"
            placeholder="Titre de la recette"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-lg bg-[#232832] text-white px-4 py-3 placeholder-gray-400"
            placeholder="Description (optionnel)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            {mealCategories.map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-2 rounded-xl border text-sm whitespace-nowrap ${
                  categories.includes(cat)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-[#232832] border-gray-600 text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-white font-semibold mb-1">Ingrédients</label>
            {ingredients.map((ing, i) => (
              <input
                key={i}
                value={ing}
                onChange={e => updateIngredient(i, e.target.value)}
                onBlur={() => handleIngredientBlur(i)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleIngredientBlur(i);
                  }
                }}
                className="w-full rounded-lg bg-[#232832] text-white px-3 py-2 mb-2"
                placeholder="Ajouter un ingrédient..."
              />
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 text-blue-400 font-semibold"
            >
              + Ajouter un ingrédient
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-white font-semibold mb-1">Instructions</label>
            {steps.map((step, i) => (
              <input
                key={i}
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                onBlur={() => handleStepBlur(i)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleStepBlur(i);
                  }
                }}
                className="w-full rounded-lg bg-[#232832] text-white px-3 py-2 mb-2"
                placeholder={`Étape ${i + 1}`}
              />
            ))}
            <button
              type="button"
              onClick={addStep}
              className="mt-2 text-blue-400 font-semibold"
            >
              + Ajouter une étape
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-white">Portions</span>
              <button
                type="button"
                onClick={openPortionModal}
                className="text-blue-400 font-bold"
              >
                Définir
              </button>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-white">Temps de préparation</span>
              <button
                type="button"
                onClick={openPrepModal}
                className="text-blue-400 font-bold"
              >
                Régler le temps
              </button>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-white">Temps de cuisson</span>
              <button
                type="button"
                onClick={openCookModal}
                className="text-blue-400 font-bold"
              >
                Régler le temps
              </button>
            </div>
          </div>
        </form>
        {showPortion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPortion(false)}>
            <div className="bg-[#222B3A] rounded-xl p-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold mb-2">Portions</h3>
              <input
                type="number"
                min={1}
                max={99}
                value={servings || 0}
                onChange={e => setServings(e.target.value)}
                className="w-full rounded-lg bg-[#232832] text-white px-3 py-2 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowPortion(false)} className="px-3 py-1 border rounded text-white">Annuler</button>
                <button onClick={() => setShowPortion(false)} className="px-3 py-1 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </div>
          </div>
        )}
        {showPrep && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPrep(false)}>
            <div className="bg-[#222B3A] rounded-xl p-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold mb-2">Temps de préparation</h3>
              <div className="flex gap-2 mb-4">
                <select value={prepHours} onChange={e => setPrepHours(parseInt(e.target.value))} className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2">
                  {Array.from({ length: 6 }).map((_,i)=>(<option key={i} value={i}>{i}h</option>))}
                </select>
                <select value={prepMinutes} onChange={e => setPrepMinutes(parseInt(e.target.value))} className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2">
                  {Array.from({ length: 60 }).map((_,i)=>(<option key={i} value={i}>{i}m</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowPrep(false)} className="px-3 py-1 border rounded text-white">Annuler</button>
                <button onClick={() => {setPrepTime(formatTime(prepHours, prepMinutes));setShowPrep(false);}} className="px-3 py-1 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </div>
          </div>
        )}
        {showCook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCook(false)}>
            <div className="bg-[#222B3A] rounded-xl p-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold mb-2">Temps de cuisson</h3>
              <div className="flex gap-2 mb-4">
                <select value={cookHours} onChange={e => setCookHours(parseInt(e.target.value))} className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2">
                  {Array.from({ length: 6 }).map((_,i)=>(<option key={i} value={i}>{i}h</option>))}
                </select>
                <select value={cookMinutes} onChange={e => setCookMinutes(parseInt(e.target.value))} className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2">
                  {Array.from({ length: 60 }).map((_,i)=>(<option key={i} value={i}>{i}m</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCook(false)} className="px-3 py-1 border rounded text-white">Annuler</button>
                <button onClick={() => {setCookTime(formatTime(cookHours, cookMinutes));setShowCook(false);}} className="px-3 py-1 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeForm;

