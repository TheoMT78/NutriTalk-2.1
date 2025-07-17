import React from 'react';
import { PieChart } from 'lucide-react';

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  className?: string;
}

const MacroChart: React.FC<MacroChartProps> = ({ protein, carbs, fat, className = '' }) => {
  const total = protein + carbs + fat;
  
  if (total === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <PieChart className="text-green-500 mr-2" size={20} />
            Répartition Macronutriments
          </h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 dark:text-gray-400">
            Aucune donnée disponible
          </p>
        </div>
      </div>
    );
  }

  const proteinPercentage = (protein / total) * 100;
  const carbsPercentage = (carbs / total) * 100;
  const fatPercentage = (fat / total) * 100;

  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatCalories = fat * 9;
  const totalCalories = proteinCalories + carbsCalories + fatCalories;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <PieChart className="text-green-500 mr-2" size={20} />
          Macronutriments
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {total.toFixed(0)}g total
        </span>
      </div>

      {/* Graphique en barres horizontales */}
      <div className="space-y-4">
        {/* Protéines */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Protéines</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {protein.toFixed(0)}g ({proteinPercentage.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${proteinPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {proteinCalories.toFixed(0)} kcal
          </div>
        </div>

        {/* Glucides */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium">Glucides</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {carbs.toFixed(0)}g ({carbsPercentage.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${carbsPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {carbsCalories.toFixed(0)} kcal
          </div>
        </div>

        {/* Lipides */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium">Lipides</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {fat.toFixed(0)}g ({fatPercentage.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${fatPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {fatCalories.toFixed(0)} kcal
          </div>
        </div>
      </div>

      {/* Résumé */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Calories totales des macronutriments
          </div>
          <div className="text-xl font-bold text-green-600">
            {totalCalories.toFixed(0)} kcal
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroChart;