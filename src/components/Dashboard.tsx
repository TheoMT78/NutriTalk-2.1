import React from 'react';
import { Trash2, Edit3, Coffee, Utensils, Moon as Dinner, Apple } from 'lucide-react';
import { User, DailyLog, FoodEntry } from '../types';
import MacroDetailsModal from './MacroDetailsModal';
import EditEntryModal from './EditEntryModal';
import StepProgress, { CALORIES_PER_STEP } from './StepProgress';
import WaterProgress from './WaterProgress';
import CalorieProgress from './CalorieProgress';
import WeightChart from './WeightChart';
import MacrosRingDashboard from './MacrosRingDashboard';
import { deviceSync } from '../utils/deviceSync';
import { safeNumber } from '../utils/safeNumber';

interface DashboardProps {
  user: User;
  dailyLog: DailyLog;
  onRemoveEntry: (id: string) => void;
  onUpdateWater: (amount: number) => void;
  onUpdateSteps: (amount: number) => void;
  onUpdateWeight: (delta: number) => void;
  onUpdateEntry: (entry: FoodEntry) => void;
  weightHistory: { date: string; weight: number }[];
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  dailyLog,
  onRemoveEntry,
  onUpdateWater,
  onUpdateSteps,
  onUpdateWeight,
  onUpdateEntry,
  weightHistory
}) => {
  const getMealIcon = (meal: string) => {
    switch (meal) {
      case 'petit-déjeuner': return Coffee;
      case 'déjeuner': return Utensils;
      case 'dîner': return Dinner;
      case 'collation': return Apple;
      default: return Utensils;
    }
  };

  const dailyCaloriesGoal = safeNumber(user?.dailyCalories);
  const stepGoal = safeNumber(user?.stepGoal);
  const waterGoal = safeNumber(user?.dailyWater);

  const syncRef = React.useRef<Record<string, boolean>>({});
  const [isSyncingSteps, setIsSyncingSteps] = React.useState(false);

  const syncSteps = React.useCallback(async () => {
    if (!user.id || isSyncingSteps) return;
    setIsSyncingSteps(true);
    try {
      const steps = await deviceSync({ userId: user.id, date: dailyLog.date });
      if (
        typeof steps === 'number' &&
        !Number.isNaN(steps) &&
        steps >= 0 &&
        steps <= 100000
      ) {
        const diff = steps - dailyLog.steps;
        if (diff > 0 && diff < 20000) {
          onUpdateSteps(diff);
        }
      } else {
        console.warn('Invalid step count from deviceSync:', steps);
      }
    } catch (err) {
      console.error('deviceSync failure', err);
    } finally {
      setIsSyncingSteps(false);
      syncRef.current[dailyLog.date] = true;
    }
  }, [user.id, dailyLog.date, dailyLog.steps, isSyncingSteps, onUpdateSteps]);

  React.useEffect(() => {
    let cancelled = false;
    if (syncRef.current[dailyLog.date]) return;
    const run = async () => {
      await syncSteps();
      if (cancelled) setIsSyncingSteps(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user.id, dailyLog.date]);

  const getGoalMessage = () => {
    const stepsCalories = Math.max(0, dailyLog.steps - 4000) * CALORIES_PER_STEP;
    const totalGoal = dailyCaloriesGoal + stepsCalories;
    const caloriesRemaining = totalGoal - dailyLog.totalCalories;
    if (caloriesRemaining > 0) {
      return `Il vous reste ${caloriesRemaining.toFixed(0)} calories aujourd'hui`;
    }
    return `Vous avez dépassé votre objectif de ${Math.abs(caloriesRemaining).toFixed(0)} calories`;
  };

  const stepsCalories = Math.max(0, dailyLog.steps - 4000) * CALORIES_PER_STEP;

  const [showMacros, setShowMacros] = React.useState(false);
  const [editing, setEditing] = React.useState<FoodEntry | null>(null);

  const groupedEntries = dailyLog.entries.reduce((acc, entry) => {
    if (!acc[entry.meal]) {
      acc[entry.meal] = {} as Record<string, typeof entry>;
    }
    const key = `${entry.name}-${entry.unit}`;
    if (acc[entry.meal][key]) {
      const existing = acc[entry.meal][key];
      existing.quantity += entry.quantity;
      existing.calories += entry.calories;
      existing.protein += entry.protein;
      existing.carbs += entry.carbs;
      existing.fat += entry.fat;
    } else {
      acc[entry.meal][key] = { ...entry };
    }
    return acc;
  }, {} as Record<string, Record<string, typeof dailyLog.entries[0]>>);

  const mealOrder = ['petit-déjeuner', 'déjeuner', 'dîner', 'collation'];

  return (
    <div className="space-y-6">
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div onClick={() => setShowMacros(true)} className="cursor-pointer">
          <CalorieProgress
            consumed={dailyLog.totalCalories}
            burned={stepsCalories}
            target={dailyCaloriesGoal}
            className="bg-[#222B3A] rounded-2xl p-6 shadow-md w-full"
          />
        </div>
          <StepProgress
            current={dailyLog.steps}
            target={stepGoal}
            onUpdate={onUpdateSteps}
            onSync={syncSteps}
            syncing={isSyncingSteps}
            className="bg-[#222B3A] rounded-2xl p-6 shadow-md w-full"
          />
          <WaterProgress
            current={dailyLog.water}
            target={waterGoal}
            onUpdate={onUpdateWater}
            className="bg-[#222B3A] rounded-2xl p-6 shadow-md w-full"
          />
          <div className="bg-[#222B3A] rounded-2xl p-6 shadow-md flex flex-col items-center justify-center w-full">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Poids</p>
          <p className="text-2xl font-bold mb-2">{(user.weight ?? 0).toFixed(1)} kg</p>
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            <button onClick={() => onUpdateWeight(-1)} className="px-2 py-1 border rounded">-1</button>
            <button onClick={() => onUpdateWeight(-0.5)} className="px-2 py-1 border rounded">-0.5</button>
            <button onClick={() => onUpdateWeight(-0.1)} className="px-2 py-1 border rounded">-0.1</button>
            <button onClick={() => onUpdateWeight(0.1)} className="px-2 py-1 border rounded">+0.1</button>
            <button onClick={() => onUpdateWeight(0.5)} className="px-2 py-1 border rounded">+0.5</button>
            <button onClick={() => onUpdateWeight(1)} className="px-2 py-1 border rounded">+1</button>
          </div>
          <WeightChart data={weightHistory.slice(-7)} />
        </div>
      </div>

      {/* Statistiques principales */}
      <MacrosRingDashboard user={user} log={dailyLog} />


      {/* Journal alimentaire */}
      <div className="bg-[#222B3A] rounded-2xl shadow-md">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold">Journal alimentaire</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {new Date(dailyLog.date).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {mealOrder.map((meal) => {
            const mealEntries = Object.values(groupedEntries[meal] || {});
            const MealIcon = getMealIcon(meal);
            const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0);
            
            return (
              <div key={meal} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MealIcon size={20} className="text-blue-500" />
                    <h4 className="font-medium capitalize">{meal}</h4>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(mealCalories ?? 0).toFixed(0)} kcal
                  </span>
                </div>
                
                {mealEntries.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Aucun aliment ajouté pour ce repas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {mealEntries.map((entry) => {
                      const displayUnit = entry.unit.replace(/^100/, '');
                      const qty = `${entry.quantity}${displayUnit.startsWith('g') || displayUnit.startsWith('ml') ? displayUnit : ' ' + displayUnit}`;
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{entry.name}</span>
                              <span className="text-sm text-gray-500">{qty}</span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {(entry.calories ?? 0).toFixed(0)} kcal •
                              P: {(entry.protein ?? 0).toFixed(0)}g •
                              G: {(entry.carbs ?? 0).toFixed(0)}g •
                              L: {(entry.fat ?? 0).toFixed(0)}g
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditing(entry)}
                              className="p-1 text-gray-500 hover:text-blue-500 transition-colors duration-200"
                              title="Modifier"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => onRemoveEntry(entry.id)}
                              className="p-1 text-gray-500 hover:text-red-500 transition-colors duration-200"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {showMacros && (
        <MacroDetailsModal user={user} log={dailyLog} onClose={() => setShowMacros(false)} />
      )}
      {editing && (
        <EditEntryModal
          entry={editing}
          onClose={() => setEditing(null)}
          onSave={(e) => {
            onUpdateEntry(e);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
