import React, { useState, useRef } from 'react';
import { Camera, X, Mic, Trash, Check } from 'lucide-react';
import { SwipeableList, SwipeableListItem } from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

const numberWords: Record<string, string> = {
  un: '1',
  une: '1',
  deux: '2',
  trois: '3',
  quatre: '4',
  cinq: '5',
  six: '6',
  sept: '7',
  huit: '8',
  neuf: '9',
  dix: '10'
};

const replaceNumberWords = (str: string) => {
  let out = str;
  Object.entries(numberWords).forEach(([w, n]) => {
    out = out.replace(new RegExp(`\\b${w}\\b`, 'gi'), n);
  });
  return out;
};

const parseIngredientsInput = (value: string): string[] => {
  let text = replaceNumberWords(value.toLowerCase());
  text = text.replace(/grammes?|gramme|grams?|gr\b/gi, 'g');
  text = text.replace(/[;,]/g, '\n');
  text = text.replace(/\b(?:et|puis|ensuite|apres|après|alors)\b/gi, '\n');
  text = text.replace(/(\d+\s*(?:kg|g|ml|cl|l)?)/g, '\n$1');
  const items = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const valid = /^(\d+\s*(?:kg|g|ml|cl|l)?\s*(?:de\s+)?[\wàâéèêëîïôûùüÿçœæ-]+|[\wàâéèêëîïôûùüÿçœæ-]+)$/i;
  return items.filter((it) => valid.test(it));
};

const parseInstructionsInput = (value: string): string[] => {
  return value
    .replace(/\r/g, '')
    .replace(/(\d+\.|;)/g, '\n')
    .replace(/\b(?:puis|ensuite|apres|après|alors|etape(?:\s+suivante)?)\b/gi, '\n')
    .replace(/[.]/g, '\n')
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
import { computeRecipeMacros } from '../utils/computeRecipeMacros';

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

const parseIngredient = (ing: string) => {
  const match = ing.match(/^(\d+\s*(?:kg|g|ml|cl|l)?)\s+(.+)/i);
  if (match) {
    return (
      <>
        <b>{match[1]}</b> {match[2]}
      </>
    );
  }
  return ing;
};

interface Props {
  onSave: (r: Recipe) => void;
  onClose: () => void;
  initialRecipe?: Recipe;
}

const mealCategories = ['Petit-déj', 'Déjeuner', 'Dîner', 'Collation'];

const RecipeForm: React.FC<Props> = ({ onSave, onClose, initialRecipe }) => {
  const [name, setName] = useState(initialRecipe?.name || '');
  const [description, setDescription] = useState(initialRecipe?.description || '');
  const [image, setImage] = useState(initialRecipe?.image || '');
  const [categories, setCategories] = useState<string[]>(initialRecipe?.categories || []);
  const [ingredients, setIngredients] = useState<string[]>(initialRecipe?.ingredients || []);
  const [ingredientInput, setIngredientInput] = useState('');
  const [steps, setSteps] = useState<string[]>(initialRecipe?.instructions || []);
  const [stepInput, setStepInput] = useState('');
  const [servings, setServings] = useState(String(initialRecipe?.servings || 1));
  const [prepTime, setPrepTime] = useState(initialRecipe?.prepTime || '');
  const [cookTime, setCookTime] = useState(initialRecipe?.cookTime || '');
  const [showPortion, setShowPortion] = useState(false);
  const [showPrep, setShowPrep] = useState(false);
  const [showCook, setShowCook] = useState(false);
  const [prepHours, setPrepHours] = useState(0);
  const [prepMinutes, setPrepMinutes] = useState(0);
  const [cookHours, setCookHours] = useState(0);
  const [cookMinutes, setCookMinutes] = useState(0);
  const [recordingTarget, setRecordingTarget] = useState<'ing' | 'step' | null>(null);
  const [dictationText, setDictationText] = useState('');
  const ingRecRef = useRef<SpeechRecognition | null>(null);
  const stepRecRef = useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishDictation(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishDictation(false);
      }
    };
    if (recordingTarget) {
      document.addEventListener('keydown', handler);
    }
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [recordingTarget, dictationText]);

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

  const updateIngredient = (i: number, v: string) => {
    const arr = [...ingredients];
    arr[i] = v;
    setIngredients(arr);
  };

  const addIngredientsFromInput = () => {
    const items = parseIngredientsInput(ingredientInput);
    if (items.length) {
      setIngredients([...ingredients, ...items]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const startDictation = (target: 'ing' | 'step') => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;
    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = true;
    setDictationText('');
    setRecordingTarget(target);
    if (target === 'ing') ingRecRef.current = recognition; else stepRecRef.current = recognition;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ');
      setDictationText(transcript);
    };
    recognition.onend = () => {
      if (recordingTarget) recognition.start();
    };
    recognition.start();
  };

  const finishDictation = (accept: boolean) => {
    if (recordingTarget === 'ing') {
      ingRecRef.current?.stop();
    } else if (recordingTarget === 'step') {
      stepRecRef.current?.stop();
    }
    if (accept && dictationText.trim()) {
      if (recordingTarget === 'ing') {
        setIngredientInput((prev) => (prev ? prev + ' ' : '') + dictationText.trim());
        addIngredientsFromInput();
      } else if (recordingTarget === 'step') {
        setStepInput((prev) => (prev ? prev + ' ' : '') + dictationText.trim());
        addStepsFromInput();
      }
    }
    setRecordingTarget(null);
    setDictationText('');
  };

  const updateStep = (i: number, v: string) => {
    const arr = [...steps];
    arr[i] = v;
    setSteps(arr);
  };
  const handleStepBlur = (i: number) => {
    const items = parseInstructionsInput(steps[i]);
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

  const addStepsFromInput = () => {
    const items = parseInstructionsInput(stepInput);
    if (items.length) {
      setSteps([...steps, ...items]);
      setStepInput('');
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
    addIngredientsFromInput();
    addStepsFromInput();
    const macros = computeRecipeMacros(ingredients);
    const recipe: Recipe = {
      id: initialRecipe?.id || Date.now().toString(),
      name,
      description: description || undefined,
      image: image || undefined,
      categories,
      ingredients: ingredients.filter(Boolean),
      instructions: steps.filter(Boolean),
      servings: parseInt(servings, 10) || 1,
      prepTime: prepTime || '0',
      cookTime: cookTime || '0',
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat
    };
    onSave(recipe);
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
            <p className="text-xs text-gray-400 mb-1">Appuyer pour modifier</p>
            <SwipeableList>
              {ingredients.map((ing, i) => (
                <SwipeableListItem
                  key={i}
                  swipeLeft={{
                    content: (
                      <div className="flex items-center justify-end pr-4 bg-red-600 text-white h-full">
                        <Trash />
                      </div>
                    ),
                    action: () => removeIngredient(i)
                  }}
                >
                  <div className="flex items-center gap-2 bg-[#232832] rounded-lg px-3 py-2 mb-2 w-full">
                    <span>{getEmoji(ing)}</span>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => updateIngredient(i, e.currentTarget.textContent || '')}
                      className="flex-1 text-white outline-none break-words whitespace-pre-line overflow-hidden"
                    >
                      {parseIngredient(ing)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                      aria-label="Supprimer"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </SwipeableListItem>
              ))}
            </SwipeableList>
            <div className="flex items-center gap-2 mt-2">
              <input
                value={ingredientInput}
                onChange={e => setIngredientInput(e.target.value)}
                onBlur={addIngredientsFromInput}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addIngredientsFromInput();
                  }
                }}
                placeholder="Ajouter un ingrédient ou en coller plusieurs"
                className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2"
              />
              <button
                type="button"
                onClick={() => startDictation('ing')}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#232832] text-white"
                aria-label="Dictée"
              >
                <Mic className={recordingTarget === 'ing' ? 'animate-pulse text-blue-400' : ''} size={20} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-white font-semibold mb-1">Instructions</label>
            <p className="text-xs text-gray-400 mb-1">Appuyer pour modifier</p>
            <SwipeableList>
              {steps.map((step, i) => (
                <SwipeableListItem
                  key={i}
                  swipeLeft={{
                    content: (
                      <div className="flex items-center justify-end pr-4 bg-red-600 text-white h-full">
                        <Trash />
                      </div>
                    ),
                    action: () => removeStep(i)
                  }}
                >
                  <div className="flex items-center gap-2 bg-[#232832] rounded-lg px-3 py-2 mb-2 w-full">
                    <span className="text-gray-400" style={{minWidth:'1.5rem'}}>{i + 1}.</span>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => updateStep(i, e.currentTarget.textContent || '')}
                      className="flex-1 bg-transparent text-white outline-none break-words whitespace-pre-line overflow-hidden"
                    >
                      {step}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                      aria-label="Supprimer"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </SwipeableListItem>
              ))}
            </SwipeableList>
            <div className="flex items-center gap-2 mt-2">
              <input
                value={stepInput}
                onChange={e => setStepInput(e.target.value)}
                onBlur={addStepsFromInput}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStepsFromInput();
                  }
                }}
                placeholder="Ajouter une étape ou plusieurs"
                className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2"
              />
              <button
                type="button"
                onClick={() => startDictation('step')}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#232832] text-white"
                aria-label="Dictée"
              >
                <Mic className={recordingTarget === 'step' ? 'animate-pulse text-blue-400' : ''} size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Portions</span>
                  <span className="text-gray-300">{servings} pers.</span>
                </div>
                <button
                  type="button"
                  onClick={openPortionModal}
                  className="text-blue-400 font-bold"
                >
                  Définir
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Sélectionnez le nombre de portions que cette recette permet de réaliser
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Temps de préparation</span>
                  {prepTime && <span className="text-gray-300">{prepTime}</span>}
                </div>
                <button
                  type="button"
                  onClick={openPrepModal}
                  className="text-blue-400 font-bold"
                >
                  Régler le temps
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Combien de temps faut-il pour préparer cette recette ?
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Temps de cuisson</span>
                  {cookTime && <span className="text-gray-300">{cookTime}</span>}
                </div>
                <button
                  type="button"
                  onClick={openCookModal}
                  className="text-blue-400 font-bold"
                >
                  Régler le temps
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Combien de temps faut-il pour cuisiner cette recette ?
              </p>
            </div>
          </div>
        </form>
        {showPortion && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowPortion(false)}
          >
            <div
              className="bg-[#222B3A] rounded-xl p-4 w-full max-w-xs"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold mb-2">Portions</h3>
              <p className="text-xs text-gray-400 mb-2">
                Sélectionnez le nombre de portions que cette recette permet de réaliser
              </p>
              <select
                value={servings}
                onChange={e => setServings(e.target.value)}
                className="w-full rounded-lg bg-[#232832] text-white px-3 py-2 mb-4"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowPortion(false)}
                  className="text-gray-400 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setShowPortion(false)}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
        {showPrep && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPrep(false)}>
            <div className="bg-[#222B3A] rounded-xl p-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold mb-2">Temps de préparation</h3>
              <p className="text-xs text-gray-400 mb-2">Combien de temps faut-il pour préparer cette recette ?</p>
              <div className="flex gap-2 mb-4">
                <select
                  value={prepHours}
                  onChange={e => setPrepHours(parseInt(e.target.value))}
                  className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2"
                >
                  {Array.from({ length: 13 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i}h
                    </option>
                  ))}
                </select>
                <select value={prepMinutes} onChange={e => setPrepMinutes(parseInt(e.target.value))} className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2">
                  {Array.from({ length: 60 }).map((_,i)=>(<option key={i} value={i}>{i}m</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowPrep(false)} className="text-gray-400 text-sm">Annuler</button>
                <button onClick={() => {setPrepTime(formatTime(prepHours, prepMinutes));setShowPrep(false);}} className="px-3 py-1 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </div>
          </div>
        )}
        {showCook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCook(false)}>
            <div className="bg-[#222B3A] rounded-xl p-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold mb-2">Temps de cuisson</h3>
              <p className="text-xs text-gray-400 mb-2">Combien de temps faut-il pour cuisiner cette recette ?</p>
              <div className="flex gap-2 mb-4">
                <select
                  value={cookHours}
                  onChange={e => setCookHours(parseInt(e.target.value))}
                  className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2"
                >
                  {Array.from({ length: 13 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i}h
                    </option>
                  ))}
                </select>
                <select value={cookMinutes} onChange={e => setCookMinutes(parseInt(e.target.value))} className="flex-1 rounded-lg bg-[#232832] text-white px-3 py-2">
                  {Array.from({ length: 60 }).map((_,i)=>(<option key={i} value={i}>{i}m</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowCook(false)} className="text-gray-400 text-sm">Annuler</button>
                <button onClick={() => {setCookTime(formatTime(cookHours, cookMinutes));setShowCook(false);}} className="px-3 py-1 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </div>
          </div>
        )}
        {recordingTarget && (
          <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center space-y-4 z-50">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
              <Mic className="text-white" />
            </div>
            {dictationText && (
              <ul className="text-white max-w-xs text-left space-y-1 px-4">
                {(recordingTarget === 'ing'
                  ? parseIngredientsInput(dictationText)
                  : parseInstructionsInput(dictationText)
                ).map((t, idx) => (
                  <li key={idx}>{recordingTarget === 'step' ? `${idx + 1}. ${t}` : t}</li>
                ))}
              </ul>
            )}
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => finishDictation(false)}
                className="p-3 rounded-full bg-red-600 text-white"
              >
                <X />
              </button>
              <button
                type="button"
                onClick={() => finishDictation(true)}
                className="p-3 rounded-full bg-green-600 text-white"
              >
                <Check />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeForm;

