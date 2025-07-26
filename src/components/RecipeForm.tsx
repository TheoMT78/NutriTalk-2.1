import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
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

  const addStep = () => setSteps([...steps, '']);
  const updateStep = (i: number, v: string) => {
    const arr = [...steps];
    arr[i] = v;
    setSteps(arr);
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

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-white mb-1">Portions</label>
              <input
                type="number"
                min={1}
                value={servings}
                onChange={e => setServings(e.target.value)}
                className="w-full rounded-lg bg-[#232832] text-white px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-white mb-1">Préparation</label>
              <input
                type="number"
                min={0}
                value={prepTime}
                onChange={e => setPrepTime(e.target.value)}
                className="w-full rounded-lg bg-[#232832] text-white px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-white mb-1">Cuisson</label>
              <input
                type="number"
                min={0}
                value={cookTime}
                onChange={e => setCookTime(e.target.value)}
                className="w-full rounded-lg bg-[#232832] text-white px-3 py-2"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeForm;

