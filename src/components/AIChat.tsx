import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Bot, User, Loader } from 'lucide-react';
import { searchNutrition, geminiAnalyzeText } from '../utils/nutritionSearch';
import { searchNutritionLinks } from '../utils/api';
import { findFoodSmart } from '../utils/findFoodSmart';
import { shouldUseGemini } from "../utils/shouldUseGemini";
import { normalizeFoodName } from '../utils/normalizeFoodName';
import { foodDatabase as fullFoodBase } from '../data/foodDatabase';
import { keywordFoods } from '../data/keywordFoods';
import { unitWeights } from '../data/unitWeights';
import { parseFoods } from '../utils/parseFoods';
import { parseFoodsFromInput } from '../utils/parseFoodsFromInput';
import { detectModificationIntent } from '../utils/detectModification';
import { Recipe, FoodItem, DailyLog, FoodEntry, ParsedFood } from '../types';


interface AIChatProps {
  onClose: () => void;
  onAddFood: (food: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    vitaminA?: number;
    vitaminC?: number;
    calcium?: number;
    iron?: number;
    category: string;
    meal: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
  }) => void;
  onUpdateEntry: (entry: FoodEntry) => void;
  dailyLog: DailyLog;
  onAddRecipe?: (recipe: Recipe) => void;
  isDarkMode: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  fromGemini?: boolean;
  suggestions?: FoodSuggestion[];
  recipe?: Recipe;
}

interface FoodSuggestion {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  category: string;
  meal: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
  confidence: number;
  action?: 'edit';
  entryId?: string;
  oldQuantity?: number;
  alternatives?: string[];
}

const AIChat: React.FC<AIChatProps> = ({
  onClose,
  onAddFood,
  onUpdateEntry,
  dailyLog,
  onAddRecipe,
  isDarkMode,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Bonjour ! Je suis votre assistant nutritionnel IA. Décrivez-moi votre repas et je l'analyserai pour vous. Par exemple : 'Ce midi j'ai mangé une assiette de pâtes bolognaise avec du parmesan' ou 'J'ai pris un petit-déjeuner avec 2 œufs, du pain complet et un avocat'.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const analyzeFood = async (
    description: string
  ): Promise<{ suggestions: FoodSuggestion[]; questions: string[] }> => {
    const suggestions: FoodSuggestion[] = [];
    const questions: string[] = [];
    const lower = description.toLowerCase();
    let meal: "petit-déjeuner" | "déjeuner" | "dîner" | "collation" = "déjeuner";
    if (lower.includes("petit-déjeuner") || lower.includes("matin")) meal = "petit-déjeuner";
    else if (lower.includes("dîner") || lower.includes("soir")) meal = "dîner";
    else if (lower.includes("collation") || lower.includes("goûter")) meal = "collation";

    const naive = parseFoodsFromInput(description);
    let parsed = [] as ParsedFood[];
    if (naive.length) {
      for (const n of naive) {
        const p = await parseFoods(n.raw);
        if (p && p[0]) parsed.push(p[0]);
        else parsed.push({ name: n.name, quantity: n.quantity, unit: 'unite' });
      }
    } else {
      parsed = await parseFoods(description);
    }

    const notFound: string[] = [];

    for (const food of parsed) {
      const baseName = normalizeFoodName(food.name);
      const fromKeywords = keywordFoods.find(k =>
        k.keywords.some(kw => baseName.includes(normalizeFoodName(kw)))
      );
      let info: FoodItem | null = fromKeywords ? (fromKeywords.food as FoodItem) : null;
      if (!info) {
        const { food: found, alternatives } = findFoodSmart(baseName, fullFoodBase);
        if (alternatives.length > 0 && found) {
          questions.push(`Tu veux dire ${found.name} ou ${alternatives[0].name} ?`);
          continue;
        }
        if (found) info = found as FoodItem;
      }
      if (!info) {
        const ext = await searchNutrition(`${food.name} ${food.brand || ''}`.trim());
        if (ext) {
          info = { name: ext.name, calories: ext.calories || 0, protein: ext.protein || 0, carbs: ext.carbs || 0, fat: ext.fat || 0, category: 'Importé', unit: ext.unit || '100g' } as FoodItem;
        }
      }
      if (!info) {
        notFound.push(food.name);
        continue;
      }
      const baseAmount = parseFloat(info.unit) || 100;
      let grams = food.quantity;
      if (food.unit === "unite") {
        const w = unitWeights[normalizeFoodName(baseName)] || baseAmount;
        grams = food.quantity * w;
      } else if (food.unit === "cas") {
        grams = food.quantity * 15;
      } else if (food.unit === "cac") {
        grams = food.quantity * 5;
      }
      const mult = grams / baseAmount;
      suggestions.push({
        name: info.name,
        quantity: food.quantity,
        unit: food.unit,
        calories: info.calories * mult,
        protein: info.protein * mult,
        carbs: info.carbs * mult,
        fat: info.fat * mult,
        fiber: info.fiber ? info.fiber * mult : 0,
        vitaminA: info.vitaminA ? info.vitaminA * mult : 0,
        vitaminC: info.vitaminC ? info.vitaminC * mult : 0,
        calcium: info.calcium ? info.calcium * mult : 0,
        iron: info.iron ? info.iron * mult : 0,
        category: info.category,
        meal,
        confidence: fromKeywords ? 0.9 : info.category === "Importé" ? 0.5 : 0.6
      });
    }
    return { suggestions, questions, notFound };
  };

  const parseRecipe = (text: string): Recipe | null => {
    const lower = text.toLowerCase();
    if (!lower.includes('ingr')) return null;
    const nameMatch = text.match(/recette de ([^:.]+)/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Recette';
    const ingMatch = text.match(/ingr[ée]dients?:([^.]*)/i);
    const ingredients = ingMatch ? ingMatch[1].split(/,| et /).map(s => s.trim()).filter(Boolean) : [];
    const instrMatch = text.match(/instructions?:([^.]*)/i);
    const instructions = instrMatch ? instrMatch[1].trim() : '';
    const timeMatch = text.match(/(\d+\s*(?:min|minutes|h|heures))/i);
    const fridgeMatch = text.match(/frigo[^\d]*(\d+\s*j)/i);
    const freezerMatch = text.match(/cong\w*[^\d]*(\d+\s*j)/i);
    return { id: Date.now().toString(), name, ingredients, instructions, prepTime: timeMatch?.[1], fridgeLife: fridgeMatch?.[1], freezerLife: freezerMatch?.[1] };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'ai',
          content: "Je n'ai pas pu traiter votre demande. Essayez de simplifier ou corriger votre phrase.",
          timestamp: new Date()
        }
      ]);
    }, 10000);

    try {
      const mod = await detectModificationIntent(input).catch(() => null);
      if (mod) {
        const target = dailyLog.entries.find(
          e =>
            e.meal === mod.meal &&
            normalizeFoodName(e.name) === normalizeFoodName(mod.name)
        );
        clearTimeout(timeout);
        if (target) {
          const suggestion: FoodSuggestion = {
            name: target.name,
            quantity: mod.newQuantity,
            unit: mod.unit || target.unit,
            calories: target.calories,
            protein: target.protein,
            carbs: target.carbs,
            fat: target.fat,
            category: target.category,
            meal: target.meal,
            confidence: 1,
            action: 'edit',
            entryId: target.id,
            oldQuantity: target.quantity,
          };
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: '📝 Modification détectée :',
            timestamp: new Date(),
            suggestions: [suggestion],
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              type: 'ai',
              content: `Je n\u2019ai pas trouvé ${mod.name} pour ce ${mod.meal}.`,
              timestamp: new Date(),
            },
          ]);
        }
        setIsLoading(false);
        return;
      }

      if (shouldUseGemini(input, fullFoodBase)) {
        const gem = await geminiAnalyzeText(input);
        const text = gem ||
          'Aucun resultat trouve, merci d\u2019ajouter les valeurs a la main.';
        clearTimeout(timeout);
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: text,
            timestamp: new Date(),
            fromGemini: true
          }
        ]);
        setIsLoading(false);
        setInput('');
        voiceResultRef.current = '';
        return;
      }

      // Simulated AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { suggestions, questions, notFound } = await analyzeFood(input).catch(e => {
        console.error('analyzeFood error', e);
        return { suggestions: [] as FoodSuggestion[], questions: [] as string[], notFound: [] as string[] };
      });
      const recipe = parseRecipe(input);

      if (timedOut) return;

      if (suggestions.length < 2 && (questions.length > 0 || notFound.length > 0 || suggestions.length === 0)) {
        const gem = await geminiAnalyzeText(input);
        const text = gem || 'Aucun aliment trouvé. Essayez de décrire autrement ou vérifiez l\u2019orthographe.';
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: text,
          timestamp: new Date(),
          fromGemini: true
        };
        setMessages(prev => [...prev, aiMessage]);
        setInput('');
        voiceResultRef.current = '';
        return;
      }
    
    let aiResponse = '';
    if (questions.length > 0) {
      aiResponse = questions.join('\n');
    } else if (suggestions.length > 0 || notFound.length > 0) {
      if (suggestions.length > 0) {
        aiResponse = `J'ai analysé votre repas et identifié ${suggestions.length} aliment(s). Voici ce que j'ai trouvé :`;

        suggestions.forEach((suggestion, index) => {
          const totalCalories = (suggestion.calories ?? 0).toFixed(0);
          const displayUnit = suggestion.unit.replace(/^100/, '');
          aiResponse += `\n\n${index + 1}. **${suggestion.name}** (${suggestion.quantity}${displayUnit})` +
            `\n        - ${totalCalories} kcal` +
            `\n        - Protéines: ${(suggestion.protein ?? 0).toFixed(1)}g` +
            `\n        - Glucides: ${(suggestion.carbs ?? 0).toFixed(1)}g` +
            `\n        - Lipides: ${(suggestion.fat ?? 0).toFixed(1)}g`;
        });

        const totals = suggestions.reduce(
          (acc, s) => ({
            calories: acc.calories + s.calories,
            protein: acc.protein + s.protein,
            carbs: acc.carbs + s.carbs,
            fat: acc.fat + s.fat,
            fiber: (acc.fiber || 0) + (s.fiber || 0),
            vitaminC: (acc.vitaminC || 0) + (s.vitaminC || 0)
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, vitaminC: 0 }
        );

        aiResponse += `\n\n**Total**: ${(totals.calories ?? 0).toFixed(0)} kcal - ${(totals.protein ?? 0).toFixed(1)}g protéines, ${(totals.carbs ?? 0).toFixed(1)}g glucides, ${(totals.fat ?? 0).toFixed(1)}g lipides`;
        if (totals.fiber) {
          aiResponse += `, ${(totals.fiber ?? 0).toFixed(1)}g fibres`;
        }
        if (totals.vitaminC) {
          aiResponse += `, ${(totals.vitaminC ?? 0).toFixed(0)}mg vitamine C`;
        }
        aiResponse += '.';

        aiResponse += '\n\nVoulez-vous ajouter ces aliments à votre journal ? Vous pouvez cliquer sur "Ajouter" pour chaque aliment ou modifier les quantités si nécessaire.';
      }
      if (notFound.length > 0) {
        if (!aiResponse) aiResponse = '';
        aiResponse += '\n\n' + notFound.map(n => `❌ ${n} : Aucun résultat fiable trouvé pour cet aliment`).join('\n');
        aiResponse += '\nVous pouvez l\'ajouter manuellement si vous connaissez les valeurs.';
      }
    } else {
      const web = await searchNutritionLinks(input);
      if (web.length > 0) {
        aiResponse = `🔎 Je n\u2019ai pas trouvé "${input}" dans la base principale. Voici ce que j\u2019ai trouvé sur Internet :`;
        web.forEach((r, i) => {
          aiResponse += `\n${i + 1}. [${r.title}](${r.link})`;
        });
        aiResponse += '\n\n💡 Clique sur un lien pour consulter et ajouter manuellement les macros.';
      } else {
        aiResponse = "Aucun résultat fiable trouvé pour votre message.";
      }
    }

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: aiResponse,
      timestamp: new Date(),
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      recipe: recipe || undefined
    };

    setMessages(prev => [...prev, aiMessage]);
    // Clear the input after the AI response is displayed
    setInput('');
    voiceResultRef.current = '';
  } catch (e) {
    console.error('handleSendMessage error', e);
    if (!timedOut) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'ai',
          content: "Je n'ai pas pu traiter votre demande. Essayez de simplifier ou corriger votre phrase.",
          timestamp: new Date()
        }
      ]);
    }
  } finally {
    clearTimeout(timeout);
    if (!timedOut) setIsLoading(false);
  }
  };

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceResultRef = useRef('');

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const manual = prompt("La reconnaissance vocale n'est pas supportée par votre navigateur. Veuillez taper votre message :");
      if (manual) {
        setInput(manual);
        handleSendMessage();
      }
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      voiceResultRef.current = '';
      setInput('');
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join(' ');
      voiceResultRef.current = transcript;
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (voiceResultRef.current.trim()) {
        handleSendMessage();
      }
    };

    recognition.start();
  };

  const handleAddSuggestion = (suggestion: FoodSuggestion) => {
    if (suggestion.action === 'edit' && suggestion.entryId) {
      const entry = dailyLog.entries.find(e => e.id === suggestion.entryId);
      if (entry) {
        onUpdateEntry({ ...entry, quantity: suggestion.quantity, unit: suggestion.unit });
        const confirmMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `✅ ${entry.name} mis à jour à ${suggestion.quantity}${suggestion.unit.replace(/^100/, '')} pour le ${entry.meal}.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmMessage]);
      }
    } else {
      onAddFood(suggestion);
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `✅ **${suggestion.name}** a été ajouté à votre journal pour le ${suggestion.meal} !`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Assistant IA NutriTalk</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Analyseur nutritionnel intelligent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-4 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {message.type === 'user' ? (
                    <User size={16} />
                  ) : (
                    <Bot size={16} />
                  )}
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.fromGemini && (
                    <span className="ml-2 px-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white text-[10px]">Gemini</span>
                  )}
                </div>
                <div className="whitespace-pre-line">{message.content}</div>
                
                {/* Suggestions d'aliments */}
                {message.suggestions && (
                  <div className="mt-4 space-y-2">
                    {message.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{suggestion.name}</div>
                            <div className="text-sm opacity-70">
                              {suggestion.action === 'edit'
                                ? `${suggestion.oldQuantity ?? ''}${suggestion.unit.replace(/^100/, '')} ➜ ${suggestion.quantity}${suggestion.unit.replace(/^100/, '')}`
                                : `${suggestion.quantity}${suggestion.unit.replace(/^100/, '')} • ${(suggestion.calories ?? 0).toFixed(0)} kcal`}
                            </div>
                            {suggestion.alternatives && (
                              <div className="mt-1">
                                {`Tu veux dire ${suggestion.name} ou ${suggestion.alternatives[0]} ?`}
                              </div>
                            )}
                          </div>
                          {!suggestion.alternatives && (
                            <button
                              onClick={() => handleAddSuggestion(suggestion)}
                              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                            >
                              {suggestion.action === 'edit' ? 'Modifier' : 'Ajouter'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {message.recipe && (
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="font-semibold">{message.recipe.name}</div>
                    {message.recipe.ingredients.length > 0 && (
                      <div>
                        <div className="font-medium">Ingrédients:</div>
                        <ul className="list-disc list-inside">
                          {message.recipe.ingredients.map((ing, i) => (
                            <li key={i}>{ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {message.recipe.instructions && (
                      <div>
                        <div className="font-medium">Instructions:</div>
                        <p>{message.recipe.instructions}</p>
                      </div>
                    )}
                    {(message.recipe.prepTime || message.recipe.fridgeLife || message.recipe.freezerLife) && (
                      <div className="space-y-1">
                        {message.recipe.prepTime && <div>Préparation: {message.recipe.prepTime}</div>}
                        {message.recipe.fridgeLife && <div>Conservation frigo: {message.recipe.fridgeLife}</div>}
                        {message.recipe.freezerLife && <div>Conservation congélo: {message.recipe.freezerLife}</div>}
                      </div>
                    )}
                    {onAddRecipe && (
                      <button
                        onClick={() => onAddRecipe(message.recipe!)}
                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      >
                        Ajouter à mes recettes
                      </button>
                    )}
                  </div>
                )}
                {message.fromGemini && (
                  <div className="mt-2">
                    <button
                      onClick={() => alert('Fonctionnalité à venir')}
                      className="text-xs text-blue-400 underline"
                    >
                      Ajouter à ma base
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className={`max-w-[80%] rounded-xl p-4 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="flex items-center space-x-2">
                  <Bot size={16} />
                  <Loader size={16} className="animate-spin" />
                  <span>Analyse en cours...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isListening
                  ? 'bg-red-500 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Reconnaissance vocale"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Décrivez votre repas... (ex: 'J'ai mangé 150g de riz avec du poulet')"
              className={`flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;