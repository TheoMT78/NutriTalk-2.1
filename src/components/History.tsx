import React, { useState } from 'react';
import { Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '../types';
import WeightChart from './WeightChart';
import StepHistoryChart from './StepHistoryChart';

interface HistoryProps {
  user: User;
  weightHistory: { date: string; weight: number }[];
}

const History: React.FC<HistoryProps> = ({ user, weightHistory }) => {
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stepsPeriod, setStepsPeriod] = useState<'week' | 'month' | 'sixMonths' | 'year'>('week');
  const [weightPeriod, setWeightPeriod] = useState<'week' | 'month' | 'threeMonths' | 'sixMonths'>('week');
  const [filterDate, setFilterDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Historique vide au premier lancement
interface HistoryDay {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  weight: number;
  steps: number;
  targetCalories: number;
  meals: number;
}

  const [historyData] = useState<HistoryDay[]>([]);

  const getCurrentPeriodData = () => {
    const days = currentView === 'monthly' ? 30 : currentView === 'weekly' ? 7 : 7;
    return historyData.slice(-days);
  };



  const currentData = getCurrentPeriodData();
  const avgCalories = currentData.length
    ? Math.round(currentData.reduce((sum, day) => sum + day.calories, 0) / currentData.length)
    : 0;
  const avgProtein = currentData.length
    ? Math.round(currentData.reduce((sum, day) => sum + day.protein, 0) / currentData.length)
    : 0;
  const avgCarbs = currentData.length
    ? Math.round(currentData.reduce((sum, day) => sum + day.carbs, 0) / currentData.length)
    : 0;
  const avgFat = currentData.length
    ? Math.round(currentData.reduce((sum, day) => sum + day.fat, 0) / currentData.length)
    : 0;

  const getStepChartData = () => {
    switch (stepsPeriod) {
      case 'week':
        return historyData.slice(-7).map(d => ({
          label:
            new Date(d.date)
              .toLocaleDateString('fr-FR', { weekday: 'short' })
              .slice(0, 3)
              .toLowerCase() + '.',
          value: d.steps,
        }));
      case 'month':
        return historyData.slice(-30).map(d => ({
          label: new Date(d.date).getDate().toString(),
          value: d.steps,
        }));
      case 'sixMonths': {
        const last = historyData.slice(-182);
        const arr: { label: string; value: number }[] = [];
        for (let i = 0; i < last.length; i += 7) {
          const week = last.slice(i, i + 7);
          const avg = week.reduce((s, x) => s + x.steps, 0) / week.length;
          const label = new Date(week[0].date).toLocaleDateString('fr-FR', { month: 'short' });
          arr.push({ label, value: Math.round(avg) });
        }
        return arr;
      }
      case 'year': {
        const months: { label: string; value: number }[] = [];
        for (let m = 0; m < 12; m++) {
          const monthData = historyData.filter(d => new Date(d.date).getMonth() === m).slice(-31);
          if (monthData.length) {
            const val = monthData.reduce((s, x) => s + x.steps, 0) / monthData.length;
            const label = new Date(2020, m, 1)
              .toLocaleDateString('fr-FR', { month: 'short' })
              .charAt(0)
              .toUpperCase();
            months.push({ label, value: Math.round(val) });
          }
        }
        return months;
      }
    }
  };

  const getStepChartTicks = () => {
    switch (stepsPeriod) {
      case 'month': {
        const last = historyData.slice(-30);
        const arr: { index: number; label: string }[] = [];
        for (let i = 0; i < last.length; i += 7) {
          arr.push({ index: i, label: new Date(last[i].date).getDate().toString() });
        }
        return arr;
      }
      case 'sixMonths': {
        const last = historyData.slice(-182);
        const arr: { index: number; label: string }[] = [];
        let weekIdx = 0;
        for (let i = 0; i < last.length; i += 7) {
          if (i % 28 === 0) {
            const label = new Date(last[i].date).toLocaleDateString('fr-FR', { month: 'short' });
            arr.push({ index: weekIdx, label });
          }
          weekIdx++;
        }
        return arr;
      }
      default:
        return undefined;
    }
  };


  const getWeightChartData = () => {
    const data = weightHistory;
    if (data.length === 0) return [] as { label: string; weight: number }[];
    switch (weightPeriod) {
      case 'week':
        return data.slice(-7).map(d => ({
          label: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 1),
          weight: d.weight,
        }));
      case 'month':
        return data.slice(-30).map(d => ({ label: new Date(d.date).getDate().toString(), weight: d.weight }));
      case 'threeMonths': {
        const last = data.slice(-90);
        const arr: { label: string; weight: number }[] = [];
        for (let i = 0; i < last.length; i += 30) {
          const month = last.slice(i, i + 30);
          const avg = month.reduce((s, x) => s + x.weight, 0) / month.length;
          const label = new Date(month[0].date).toLocaleDateString('fr-FR', { month: 'short' });
          arr.push({ label, weight: parseFloat(avg.toFixed(1)) });
        }
        return arr;
      }
      case 'sixMonths': {
        const last = data.slice(-180);
        const arr: { label: string; weight: number }[] = [];
        for (let i = 0; i < last.length; i += 30) {
          const month = last.slice(i, i + 30);
          const avg = month.reduce((s, x) => s + x.weight, 0) / month.length;
          const label = new Date(month[0].date)
            .toLocaleDateString('fr-FR', { month: 'short' })
            .charAt(0)
            .toUpperCase();
          arr.push({ label, weight: parseFloat(avg.toFixed(1)) });
        }
        return arr;
      }
      }
  };

  const renderDatePicker = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const blanks = (startDay + 6) % 7;

    const daySquares = [] as JSX.Element[];
    for (let i = 0; i < blanks; i++) {
      daySquares.push(<div key={`b${i}`} />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d
        .toString()
        .padStart(2, '0')}`;
      const dayData = historyData.find(h => h.date === dateStr);
      let color = 'bg-gray-700';
      if (dayData) {
        if (dayData.calories === 0) color = 'bg-red-600';
        else if (Math.abs(dayData.calories - dayData.targetCalories) <= dayData.targetCalories * 0.05)
          color = 'bg-green-600';
        else color = 'bg-orange-500';
      }
      daySquares.push(
        <button
          key={d}
          onClick={() => {
            setFilterDate(dateStr);
            setShowDatePicker(false);
            setCalendarDate(new Date(year, month, d));
          }}
          className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-sm flex items-center justify-center rounded ${color} hover:brightness-110`}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="absolute z-10 mt-1 right-0 bg-gray-800 text-white p-2 rounded shadow-lg w-80 sm:w-96 md:w-[28rem]">
        <div className="flex items-center justify-between mb-2 text-sm">
          <button
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
            className="px-1"
          >
            {"<"}
          </button>
          <span>
            {calendarDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
            className="px-1"
          >
            {">"}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs mb-1">
          {['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].map(d => (
            <div key={d} className="text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{daySquares}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Historique nutritionnel</h2>
      </div>

      {/* Filtres de vue */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="text-blue-500" size={24} />
            <h3 className="text-lg font-semibold">Période d'analyse</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium">
              {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                currentView === view
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {view === 'daily' ? 'Quotidien' : 
               view === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
            </button>
          ))}
        </div>
      </div>

      {/* Statistiques moyennes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="text-green-500" size={24} />
          <h3 className="text-lg font-semibold">Moyennes des 7 derniers jours</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{avgCalories}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
            <div className="text-xs text-gray-500">
              {avgCalories > user.dailyCalories ? '+' : ''}
              {avgCalories - user.dailyCalories} par rapport à l'objectif
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{avgProtein}g</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Protéines</div>
            <div className="text-xs text-gray-500">
              {avgProtein > user.dailyProtein ? '+' : ''}
              {avgProtein - user.dailyProtein}g par rapport à l'objectif
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{avgCarbs}g</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Glucides</div>
            <div className="text-xs text-gray-500">
              {avgCarbs > user.dailyCarbs ? '+' : ''}
              {avgCarbs - user.dailyCarbs}g par rapport à l'objectif
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{avgFat}g</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lipides</div>
            <div className="text-xs text-gray-500">
              {avgFat > user.dailyFat ? '+' : ''}
              {avgFat - user.dailyFat}g par rapport à l'objectif
            </div>
          </div>
        </div>
      </div>

      {/* Détails par jour */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Détails par jour</h3>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Calendar size={18} />
            </button>
            {showDatePicker && renderDatePicker()}
          </div>
        </div>

        {historyData.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Aucune donnée pour le moment</p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Calories
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Protéines
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Glucides
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lipides
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Eau
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Poids
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {(filterDate ? historyData.filter(d => d.date === filterDate) : historyData.slice(-10).reverse()).map((day) => {
                return (
                <tr key={day.date} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 whitespace-nowrap font-medium">
                    {new Date(day.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`font-medium ${
                      day.calories > user.dailyCalories ? 'text-red-500' : 'text-green-500'
                    }`}
                    >
                      {day.calories}
                    </span>
                    <span className="text-gray-500 ml-1">kcal</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {day.protein}g
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {day.carbs}g
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {day.fat}g
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {day.water}ml
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {day.weight}kg
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Graphique des pas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Évolution des pas</h3>
          <select
            value={stepsPeriod}
            onChange={(e) => setStepsPeriod(e.target.value as 'week' | 'month' | 'sixMonths' | 'year')}
            className="text-sm bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
          >
            <option value="week">7j</option>
            <option value="month">1 mois</option>
            <option value="sixMonths">6 mois</option>
            <option value="year">1 an</option>
          </select>
        </div>
        {historyData.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune donnée pour le moment</p>
        ) : (
          <StepHistoryChart mode="steps" data={getStepChartData()} ticks={getStepChartTicks()} />
        )}
      </div>

      {/* Graphique du poids */}

      {/* Graphique du poids */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Évolution du poids</h3>
          <select
            value={weightPeriod}
            onChange={(e) => setWeightPeriod(e.target.value as 'week' | 'month' | 'threeMonths' | 'sixMonths')}
            className="text-sm bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
          >
            <option value="week">7j</option>
            <option value="month">1 mois</option>
            <option value="threeMonths">3 mois</option>
            <option value="sixMonths">6 mois</option>
          </select>
        </div>
        {weightHistory.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune donnée pour le moment</p>
        ) : (
          <WeightChart data={getWeightChartData()} />
        )}
      </div>

    </div>
  );
};

export default History;
