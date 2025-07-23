/* eslint-disable */
import React, { useState } from 'react';
import { savePersonalInfo } from '../utils/api';

export default function Onboarding({ userId, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    sex: 'femme',
    height: '',
    weight: '',
    activityLevel: '0-1',
    goal: 'maintien',
  });

  const fields = [
    { label: "Comment voulez-vous qu'on vous appelle ?", key: 'name', type: 'text' },
    { label: 'Quelle est votre date de naissance ?', key: 'birthDate', type: 'date' },
    { label: 'Quel est votre sexe ?', key: 'sex', type: 'radio', options: ['homme', 'femme'] },
    { label: 'Quelle est votre taille (cm) ?', key: 'height', type: 'number' },
    { label: 'Quel est votre poids actuel (kg) ?', key: 'weight', type: 'number' },
    {
      label: "Combien d'activités physiques par semaine ?",
      key: 'activityLevel',
      type: 'select',
      options: ['0-1', '1-2', '3-5', '6-7', 'plus de 7'],
    },
    {
      label: 'Quel est votre objectif ?',
      key: 'goal',
      type: 'select',
      options: [
        'perte modérée (-10%)',
        'perte légère (-5%)',
        'maintien (0%)',
        'prise légère (+5%)',
        'prise modérée (+10%)',
      ],
    },
  ];

  const current = fields[step];

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (step < fields.length - 1) {
      setStep(step + 1);
    } else {
      const payload = {
        userId,
        name: form.name,
        birthDate: form.birthDate,
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
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-center">Profil</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">{current.label}</label>
        {current.type === 'text' && (
          <input
            type="text"
            value={form[current.key]}
            onChange={e => handleChange(current.key, e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        )}
        {current.type === 'number' && (
          <input
            type="number"
            value={form[current.key]}
            onChange={e => handleChange(current.key, e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        )}
        {current.type === 'date' && (
          <input
            type="date"
            value={form[current.key]}
            onChange={e => handleChange(current.key, e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        )}
        {current.type === 'radio' && (
          <div className="space-x-4">
            {current.options.map(opt => (
              <label key={opt} className="inline-flex items-center space-x-1">
                <input
                  type="radio"
                  name="sex"
                  value={opt}
                  checked={form.sex === opt}
                  onChange={() => handleChange('sex', opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
        {current.type === 'select' && (
          <select
            value={form[current.key]}
            onChange={e => handleChange(current.key, e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {current.options.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {step === fields.length - 1 ? 'Terminer' : 'Suivant'}
        </button>
      </div>
    </div>
  );
}
