import React, { useState } from 'react';
import { savePersonalInfo } from '../utils/api';

interface PersonalInfo {
  userId: string;
  name: string;
  birthDate: string;
  sex: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
}

interface Props {
  userId: string;
  onComplete: (info: PersonalInfo) => void;
}

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];
const years = Array.from({ length: 2025 - 1920 + 1 }, (_, i) => 1920 + i);
const heights = Array.from({ length: 81 }, (_, i) => 140 + i); // 140..220
const weights = Array.from({ length: 161 }, (_, i) => 40 + i); // 40..200

const activityOptions = [
  { value: 'sédentaire', label: '0-1 activité/semaine' },
  { value: 'légère', label: '1-2 activités/semaine' },
  { value: 'modérée', label: '3-5 activités/semaine' },
  { value: 'élevée', label: '6-7 activités/semaine' },
  { value: 'très élevée', label: 'Plus de 7 activités/semaine' },
];

const goalOptions = [
  { value: 'perte10', label: 'Perte modérée (-10%)' },
  { value: 'perte5', label: 'Perte légère (-5%)' },
  { value: 'maintien', label: 'Maintien' },
  { value: 'prise5', label: 'Prise légère (+5%)' },
  { value: 'prise10', label: 'Prise modérée (+10%)' },
];

export default function Onboarding({ userId, onComplete }: Props) {
  const [form, setForm] = useState({
    name: '',
    day: 1,
    month: 'Janvier',
    year: 2000,
    sex: 'homme',
    height: 175,
    weight: 70,
    activityLevel: 'légère',
    goal: 'maintien'
  });

  const handleChange = (key: string, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const monthIndex = months.indexOf(form.month) + 1;
    const birthDate = `${form.year}-${String(monthIndex).padStart(2, '0')}-${String(form.day).padStart(2, '0')}`;
    const payload: PersonalInfo = {
      userId,
      name: form.name,
      birthDate,
      sex: form.sex,
      height: Number(form.height),
      weight: Number(form.weight),
      activityLevel: form.activityLevel,
      goal: form.goal,
    };
    try {
      const saved = await savePersonalInfo(payload);
      onComplete(saved || payload);
    } catch (err) {
      console.error('Failed to save info', err);
      onComplete(payload);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold text-center">Compléter mon profil</h2>
      <div className="space-y-4">
        <div>
          <label className="block mb-1">Nom d'utilisateur</label>
          <input
            type="text"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1">Date de naissance</label>
          <div className="flex space-x-2">
            <select
              value={form.day}
              onChange={e => handleChange('day', Number(e.target.value))}
              className="flex-1 px-2 py-2 rounded border border-gray-600 bg-gray-700"
            >
              {days.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={form.month}
              onChange={e => handleChange('month', e.target.value)}
              className="flex-1 px-2 py-2 rounded border border-gray-600 bg-gray-700"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={form.year}
              onChange={e => handleChange('year', Number(e.target.value))}
              className="flex-1 px-2 py-2 rounded border border-gray-600 bg-gray-700"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block mb-1">Sexe</label>
          <select
            value={form.sex}
            onChange={e => handleChange('sex', e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-700"
          >
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Taille (cm)</label>
          <select
            value={form.height}
            onChange={e => handleChange('height', Number(e.target.value))}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-700"
          >
            {heights.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Poids (kg)</label>
          <select
            value={form.weight}
            onChange={e => handleChange('weight', Number(e.target.value))}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-700"
          >
            {weights.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Activité physique</label>
          <select
            value={form.activityLevel}
            onChange={e => handleChange('activityLevel', e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-700"
          >
            {activityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Objectif</label>
          <select
            value={form.goal}
            onChange={e => handleChange('goal', e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-700"
          >
            {goalOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className="w-full mt-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
      >
        Valider
      </button>
    </div>
  );
}
