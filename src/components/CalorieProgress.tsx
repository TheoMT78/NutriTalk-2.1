import React from 'react';
import { Target } from 'lucide-react';

interface CalorieProgressProps {
  consumed: number;
  burned: number;
  target: number;
  className?: string;
}

import { safeNumber } from '../utils/safeNumber';

const CalorieProgress: React.FC<CalorieProgressProps> = ({ consumed, burned, target, className = '' }) => {
  const safeConsumed = safeNumber(consumed);
  const safeBurned = safeNumber(burned);
  const safeTarget = safeNumber(target);
  const totalTarget = safeTarget + safeBurned;
  const percentage = totalTarget ? Math.min((safeConsumed / totalTarget) * 100, 100) : 0;
  const remaining = Math.max(totalTarget - safeConsumed, 0);
  const isOverTarget = safeConsumed > totalTarget;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Target className="text-blue-500 mr-2" size={20} />
          Progression Calories
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {safeConsumed.toFixed(0)} / {totalTarget.toFixed(0)} kcal
        </span>
      </div>

      <div className="relative">
        {/* Cercle de progression */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            {/* Cercle de fond */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Cercle de progression */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${percentage}, 100`}
              className={`transition-all duration-500 ${
                isOverTarget ? 'text-red-500' : 'text-blue-500'
              }`}
            />
          </svg>
          
          {/* Texte au centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                isOverTarget ? 'text-red-500' : 'text-blue-500'
              }`}>
                {percentage.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isOverTarget ? 'Dépassé' : 'Atteint'}
              </div>
            </div>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="mt-6 space-y-2">
          {!isOverTarget ? (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Calories restantes
              </span>
              <span className="text-sm font-medium text-green-600">
                {remaining.toFixed(0)} kcal
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Calories en excès
              </span>
              <span className="text-sm font-medium text-red-600">
                +{(safeConsumed - totalTarget).toFixed(0)} kcal
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Consommées
            </span>
            <span className="text-sm font-medium">
              {safeConsumed.toFixed(0)} kcal
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Objectif
            </span>
            <span className="text-sm font-medium">
              {totalTarget.toFixed(0)} kcal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieProgress;