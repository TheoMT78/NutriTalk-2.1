import React from 'react';
import { Droplets } from 'lucide-react';

interface WaterProgressProps {
  current: number;
  target: number;
  onUpdate?: (delta: number) => void;
  className?: string;
}

const WaterProgress: React.FC<WaterProgressProps> = ({ current, target, onUpdate, className = '' }) => {
  const percentageRaw = (current / target) * 100;
  const percentage = Math.min(percentageRaw, 100);
  const reached = percentageRaw >= 100;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Droplets className={reached ? 'text-red-500 mr-2' : 'text-blue-500 mr-2'} size={20} />
          Hydratation
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {current} / {target} ml
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
            className={`${reached ? 'text-red-500' : 'text-blue-500'} transition-all duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-2xl font-bold ${reached ? 'text-red-500' : 'text-blue-500'}`}>{percentageRaw.toFixed(0)}%</div>
        </div>
      </div>
      {onUpdate && (
        <div className="flex justify-center flex-wrap gap-2 mt-4">
          <button onClick={() => onUpdate(1000)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">+1L</button>
          <button onClick={() => onUpdate(500)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">+500ml</button>
          <button onClick={() => onUpdate(250)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">+250ml</button>
          <button onClick={() => onUpdate(-250)} className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">-250ml</button>
        </div>
      )}
    </div>
  );
};

export default WaterProgress;
