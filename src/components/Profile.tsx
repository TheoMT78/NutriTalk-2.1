import React, { useState, useEffect, useRef } from 'react';
import { computeDailyTargets, calculateMacroTargets } from '../utils/nutrition';
import { User as UserIcon, Settings, Target, Activity, Palette } from 'lucide-react';
import NumberStepper from './NumberStepper';
import { User as UserType } from '../types';

interface ProfileProps {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [locks, setLocks] = useState({ calories: false, protein: false, carbs: false, fat: false });
  const autoTargetsRef = useRef(computeDailyTargets(user));

  const handleSave = () => {
    const auto = computeDailyTargets({
      weight: formData.weight,
      height: formData.height,
      age: formData.age,
      gender: formData.gender,
      activityLevel: formData.activityLevel,
      goal: formData.goal,
    });

    const updated = { ...formData } as UserType;

    if (!locks.calories && formData.dailyCalories === user.dailyCalories) {
      updated.dailyCalories = auto.calories;
    }

    if (!locks.protein && !locks.carbs && !locks.fat) {
      const macros = calculateMacroTargets(updated.dailyCalories);
      updated.dailyProtein = macros.protein;
      updated.dailyCarbs = macros.carbs;
      updated.dailyFat = macros.fat;
    } else if (locks.calories) {
      let remaining = updated.dailyCalories;
      if (locks.protein) remaining -= updated.dailyProtein * 4;
      if (locks.carbs) remaining -= updated.dailyCarbs * 4;
      if (locks.fat) remaining -= updated.dailyFat * 9;
      const unlocked = [] as ('protein' | 'carbs' | 'fat')[];
      if (!locks.protein) unlocked.push('protein');
      if (!locks.carbs) unlocked.push('carbs');
      if (!locks.fat) unlocked.push('fat');
      if (unlocked.length === 1) {
        const key = unlocked[0];
        if (key === 'protein') updated.dailyProtein = Math.round(remaining / 4);
        if (key === 'carbs') updated.dailyCarbs = Math.round(remaining / 4);
        if (key === 'fat') updated.dailyFat = Math.round(remaining / 9);
      } else {
        const macros = calculateMacroTargets(updated.dailyCalories);
        if (!locks.protein) updated.dailyProtein = macros.protein;
        if (!locks.carbs) updated.dailyCarbs = macros.carbs;
        if (!locks.fat) updated.dailyFat = macros.fat;
      }
    } else {
      updated.dailyCalories = updated.dailyProtein * 4 + updated.dailyCarbs * 4 + updated.dailyFat * 9;
    }

    onUpdateUser(updated);
    setFormData(updated);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user);
    setLocks({ calories: false, protein: false, carbs: false, fat: false });
    setIsEditing(false);
  };

  // Automatically update targets when profile data changes unless fields are locked
  useEffect(() => {
    const newTargets = computeDailyTargets({
      weight: formData.weight,
      height: formData.height,
      age: formData.age,
      gender: formData.gender,
      activityLevel: formData.activityLevel,
      goal: formData.goal,
    });

    const prev = autoTargetsRef.current;
    const usingAuto =
      formData.dailyCalories === prev.calories &&
      formData.dailyProtein === prev.protein &&
      formData.dailyCarbs === prev.carbs &&
      formData.dailyFat === prev.fat;

    autoTargetsRef.current = newTargets;

    if (usingAuto) {
      setFormData((f) => ({
        ...f,
        dailyCalories: locks.calories ? f.dailyCalories : newTargets.calories,
        dailyProtein: locks.protein ? f.dailyProtein : newTargets.protein,
        dailyCarbs: locks.carbs ? f.dailyCarbs : newTargets.carbs,
        dailyFat: locks.fat ? f.dailyFat : newTargets.fat,
      }));
    }
  }, [formData.weight, formData.height, formData.age, formData.gender, formData.activityLevel, formData.goal, formData.dailyCalories, formData.dailyProtein, formData.dailyCarbs, formData.dailyFat, locks.calories, locks.protein, locks.carbs, locks.fat]);

  const calculateBMI = () => {
    const heightInMeters = formData.height / 100;
    return (formData.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const calculateNeeds = () => {
    return computeDailyTargets({
      weight: formData.weight,
      height: formData.height,
      age: formData.age,
      gender: formData.gender,
      activityLevel: formData.activityLevel,
      goal: formData.goal,
    }).calories;
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mon Profil</h2>
        <div className="flex space-x-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserIcon className="text-blue-500" size={24} />
            <h3 className="text-lg font-semibold">Informations personnelles</h3>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            <Settings size={20} />
            <span>{isEditing ? 'Annuler' : 'Modifier'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{user.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{user.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Âge</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{user.age} ans</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sexe</label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                >
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 capitalize">{user.gender}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Poids (kg)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{user.weight} kg</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Taille (cm)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{user.height} cm</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Activité physique</label>
              {isEditing ? (
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, activityLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                >
                  <option value="sédentaire">0-1 activité/semaine</option>
                  <option value="légère">1-2 activités/semaine</option>
                  <option value="modérée">3-5 activités/semaine</option>
                  <option value="élevée">6-7 activités/semaine</option>
                  <option value="très élevée">Plus de 7 activités/semaine</option>
                </select>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {user.activityLevel === 'sédentaire' && '0-1 activité/semaine'}
                  {user.activityLevel === 'légère' && '1-2 activités/semaine'}
                  {user.activityLevel === 'modérée' && '3-5 activités/semaine'}
                  {user.activityLevel === 'élevée' && '6-7 activités/semaine'}
                  {user.activityLevel === 'très élevée' && 'Plus de 7 activités/semaine'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Objectif</label>
              {isEditing ? (
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                >
                  <option value="perte10">Perte modérée (-10%)</option>
                  <option value="perte5">Perte légère (-5%)</option>
                  <option value="maintien">Maintien</option>
                  <option value="prise5">Prise légère (+5%)</option>
                  <option value="prise10">Prise modérée (+10%)</option>
                </select>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {user.goal === 'perte10' ? 'Perte modérée (-10%)' :
                   user.goal === 'perte5' ? 'Perte légère (-5%)' :
                   user.goal === 'prise5' ? 'Prise légère (+5%)' :
                   user.goal === 'prise10' ? 'Prise modérée (+10%)' : 'Maintien'}
                </p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Sauvegarder
            </button>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="text-green-500" size={24} />
          <h3 className="text-lg font-semibold">Statistiques</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{calculateBMI()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">IMC</div>
            <div className="text-xs text-gray-500 mt-1">
              {parseFloat(calculateBMI()) < 18.5 ? 'Insuffisant' :
               parseFloat(calculateBMI()) < 25 ? 'Normal' :
               parseFloat(calculateBMI()) < 30 ? 'Surpoids' : 'Obésité'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{calculateNeeds()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Besoins quotidiens</div>
            <div className="text-xs text-gray-500 mt-1">kcal/jour</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{user.dailyCalories}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Objectif calorique</div>
            <div className="text-xs text-gray-500 mt-1">kcal/jour</div>
          </div>
        </div>
      </div>

      {/* Objectifs nutritionnels */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="text-orange-500" size={24} />
          <h3 className="text-lg font-semibold">Objectifs nutritionnels</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Calories quotidiennes</label>
            {isEditing ? (
              <NumberStepper
                value={formData.dailyCalories}
                onChange={(val) => setFormData(prev => ({ ...prev, dailyCalories: typeof val === 'number' ? val : val(prev.dailyCalories) }))}
                locked={locks.calories}
                onToggleLock={() => setLocks(l => ({ ...l, calories: !l.calories }))}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{user.dailyCalories} kcal</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Protéines</label>
            {isEditing ? (
              <NumberStepper
                value={formData.dailyProtein}
                onChange={(val) => setFormData(prev => ({ ...prev, dailyProtein: typeof val === 'number' ? val : val(prev.dailyProtein) }))}
                locked={locks.protein}
                onToggleLock={() => setLocks(l => ({ ...l, protein: !l.protein }))}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{user.dailyProtein} g</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Glucides</label>
            {isEditing ? (
              <NumberStepper
                value={formData.dailyCarbs}
                onChange={(val) => setFormData(prev => ({ ...prev, dailyCarbs: typeof val === 'number' ? val : val(prev.dailyCarbs) }))}
                locked={locks.carbs}
                onToggleLock={() => setLocks(l => ({ ...l, carbs: !l.carbs }))}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{user.dailyCarbs} g</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Lipides</label>
            {isEditing ? (
              <NumberStepper
                value={formData.dailyFat}
                onChange={(val) => setFormData(prev => ({ ...prev, dailyFat: typeof val === 'number' ? val : val(prev.dailyFat) }))}
                locked={locks.fat}
                onToggleLock={() => setLocks(l => ({ ...l, fat: !l.fat }))}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{user.dailyFat} g</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Objectif de pas</label>
            {isEditing ? (
              <NumberStepper
                value={formData.stepGoal}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    stepGoal: typeof val === 'number' ? val : val(prev.stepGoal)
                  }))
                }
                locked={false}
                onToggleLock={() => {}}
                showLock={false}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{user.stepGoal} pas</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hydratation quotidienne</label>
            {isEditing ? (
              <NumberStepper
                value={formData.dailyWater}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    dailyWater: typeof val === 'number' ? val : val(prev.dailyWater)
                  }))
                }
                locked={false}
                onToggleLock={() => {}}
                showLock={false}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{user.dailyWater} ml</p>
            )}
          </div>
        </div>
      </div>

      {/* Préférences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Palette className="text-purple-500" size={24} />
          <h3 className="text-lg font-semibold">Préférences</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Thème</label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="auto">Automatique</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Notifications</label>
              <p className="text-xs text-gray-500">Recevoir des rappels et alertes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {(formData.theme !== user.theme || formData.notifications !== user.notifications) && (
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Sauvegarder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;