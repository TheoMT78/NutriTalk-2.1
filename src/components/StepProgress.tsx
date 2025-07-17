import React from 'react';
import { Footprints } from 'lucide-react';

interface StepProgressProps {
  current: number;
  target: number;
  onUpdate?: (delta: number) => void;
  className?: string;
}

export const CALORIES_PER_STEP = 0.04;

const StepProgress: React.FC<StepProgressProps> = ({ current, target, onUpdate, className = '' }) => {
  const rawPercentage = (current / target) * 100;
  const percentage = Math.min(rawPercentage, 100);
  const extraSteps = Math.max(0, current - 4000);
  const caloriesBurned = extraSteps * CALORIES_PER_STEP;
  const reached = rawPercentage >= 100;
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Footprints className={reached ? 'text-red-500 mr-2' : 'text-teal-500 mr-2'} size={20} />
          Pas
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {current} / {target}
        </span>
      </div>
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200 dark:text-gray-700"
          />
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${percentage}, 100`}
            className={`${reached ? 'text-red-500' : 'text-teal-500'} transition-all duration-500`}
          />
        </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-2xl font-bold ${reached ? 'text-red-500' : 'text-teal-500'}`}>
          {rawPercentage.toFixed(0)}%
        </div>
      </div>
      </div>
      <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
        {caloriesBurned.toFixed(0)} kcal brûlées
      </div>
      {onUpdate && (
        <div className="flex justify-center flex-wrap gap-2 mt-2">
          <button
            onClick={() => onUpdate(5000)}
            className="px-3 py-1 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
          >
            +5000
          </button>
          <button
            onClick={() => onUpdate(2500)}
            className="px-3 py-1 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
          >
            +2500
          </button>
          <button
            onClick={() => onUpdate(1000)}
            className="px-3 py-1 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
          >
            +1000
          </button>
          <button
            onClick={() => onUpdate(500)}
            className="px-3 py-1 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
          >
            +500
          </button>
          <button
            onClick={() => onUpdate(-1000)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            -1000
          </button>
        </div>
      )}
    </div>
  );
};

export default StepProgress;
