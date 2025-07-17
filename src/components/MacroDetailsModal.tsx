import React from 'react';
import { X } from 'lucide-react';
import { User, DailyLog } from '../types';
import { CALORIES_PER_STEP } from './StepProgress';

interface Props {
  user: User;
  log: DailyLog;
  onClose: () => void;
}

const MacroDetailsModal: React.FC<Props> = ({ user, log, onClose }) => {
  const stepsCalories = Math.max(0, log.steps - 4000) * CALORIES_PER_STEP;
  const carbGoal = user.dailyCarbs + stepsCalories / 4;
  const extras = log.entries.reduce(
    (acc, e) => {
      acc.fiber += e.fiber || 0;
      acc.vitaminA += e.vitaminA || 0;
      acc.vitaminC += e.vitaminC || 0;
      acc.calcium += e.calcium || 0;
      acc.iron += e.iron || 0;
      return acc;
    },
    { fiber: 0, vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0 }
  );
  const items = [
    { key: 'Protéines', total: log.totalProtein, goal: user.dailyProtein, color: 'bg-green-500', unit: 'g' },
    { key: 'Glucides', total: log.totalCarbs, goal: carbGoal, color: 'bg-orange-500', unit: 'g' },
    { key: 'Lipides', total: log.totalFat, goal: user.dailyFat, color: 'bg-purple-500', unit: 'g' },
    { key: 'Fibres', total: extras.fiber, goal: 30, color: 'bg-gray-500', unit: 'g' },
    { key: 'Sucre', total: 0, goal: 50, color: 'bg-gray-500', unit: 'g' },
    { key: 'Acides gras saturés', total: 0, goal: 20, color: 'bg-gray-500', unit: 'g' },
    { key: 'Acides gras polyinsaturés', total: 0, goal: 11, color: 'bg-gray-500', unit: 'g' },
    { key: 'Acides gras monoinsaturés', total: 0, goal: 22, color: 'bg-gray-500', unit: 'g' },
    { key: 'Acides gras trans', total: 0, goal: 2, color: 'bg-gray-500', unit: 'g' },
    { key: 'Cholestérol', total: 0, goal: 300, color: 'bg-gray-500', unit: 'g' },
    { key: 'Sodium', total: 0, goal: 2300, color: 'bg-gray-500', unit: 'g' },
    { key: 'Potassium', total: 0, goal: 3500, color: 'bg-gray-500', unit: 'g' },
    { key: 'Vitamine A', total: extras.vitaminA, goal: 100, color: 'bg-gray-500', unit: '%' },
    { key: 'Vitamine C', total: extras.vitaminC, goal: 100, color: 'bg-gray-500', unit: '%' },
    { key: 'Calcium', total: extras.calcium, goal: 100, color: 'bg-gray-500', unit: '%' },
    { key: 'Fer', total: extras.iron, goal: 100, color: 'bg-gray-500', unit: '%' },
  ];

  React.useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Détails nutritionnels</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>
        <table className="w-full text-sm mb-4">
          <thead className="text-left text-gray-500 dark:text-gray-400">
            <tr>
              <th>Nutriment</th>
              <th className="text-right">Total</th>
              <th className="text-right">Objectif</th>
              <th className="text-right">Restant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map(item => (
              <React.Fragment key={item.key}>
                <tr>
                  <td className="py-2">{item.key}</td>
                  <td className="py-2 text-right">{item.total.toFixed(0)}{item.unit}</td>
                  <td className="py-2 text-right">{item.goal.toFixed(0)}{item.unit}</td>
                  <td className="py-2 text-right">{Math.max(item.goal - item.total, 0).toFixed(0)}{item.unit}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="pb-2">
                    <div className="w-2/3 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full`}
                        style={{ width: `${Math.min((item.total / item.goal) * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MacroDetailsModal;
