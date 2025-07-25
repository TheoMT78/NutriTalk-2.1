import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FoodItem } from '../types';

interface Props {
  food: FoodItem;
  meal: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
  onAdd: (entry: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    category: string;
    meal: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
  }) => void;
  onClose: () => void;
}

export default function FoodDetailModal({ food, meal, onAdd, onClose }: Props) {
  const baseQty = parseFloat(food.unit) || 100;
  const unit = food.unit.replace(/[0-9.]+/, '').trim() || 'g';
  const [quantity, setQuantity] = useState(baseQty);
  const [selectedMeal, setSelectedMeal] = useState(meal);

  const factor = quantity / baseQty;
  const totalCalories = Math.round(food.calories * factor);
  const totalProtein = Math.round(food.protein * factor);
  const totalCarbs = Math.round(food.carbs * factor);
  const totalFat = Math.round(food.fat * factor);

  const handleAdd = () => {
    onAdd({
      name: food.name,
      quantity,
      unit,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      category: food.category,
      meal: selectedMeal,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#222B3A] rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{food.name}</h2>
            {food.brand && (
              <div className="text-gray-400 text-sm mt-1">{food.brand}</div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 mb-4 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span>Quantité&nbsp;:</span>
            <input
              type="number"
              min="1"
              className="w-24 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
            />
            <span className="text-gray-400">{unit}</span>
          </div>
          <div>
            Calories totales&nbsp;:
            <span className="ml-1 font-semibold text-white">{totalCalories} kcal</span>
          </div>
        </div>
        <div className="mb-4">
          <span className="text-white">Repas&nbsp;:</span>
          <div className="flex gap-2 mt-1">
            {(['petit-déjeuner', 'déjeuner', 'dîner', 'collation'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedMeal(r)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedMeal===r ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="my-4 text-sm grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-semibold" style={{ color: '#fbc150' }}>
              {totalCarbs}g
            </div>
            <div className="text-gray-400">Glucides</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: '#23e38d' }}>
              {totalProtein}g
            </div>
            <div className="text-gray-400">Protéines</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: '#a783ff' }}>
              {totalFat}g
            </div>
            <div className="text-gray-400">Lipides</div>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
