import React from "react";
import { CALORIES_PER_STEP } from "./StepProgress";

const macroColors = {
  Protéines: "#13d38f",
  Glucides: "#ffb017",
  Lipides: "#ad4ad1",
};

function MacroCircle({ percent, color, value, target, label, extra }) {
  const displayValue = Math.max(0, Math.round(value));
  const displayTarget = Math.max(0, Math.round(target));
  const strokeDash = `${percent}, 100`;
  return (
    <div className="flex flex-col items-center w-1/3">
      <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto">
        <svg
          className="w-16 h-16 md:w-20 md:h-20 transform -rotate-90"
          viewBox="0 0 36 36"
        >
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-gray-200 dark:text-gray-700"
          />
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={strokeDash}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-bold text-base md:text-lg" style={{ color }}>
            {percent}%
          </div>
        </div>
      </div>
      <div className="mt-1 text-center font-bold">{label}</div>
      <div className="text-center">
        <span className="font-bold text-base md:text-lg">
          {displayValue.toLocaleString('fr-FR')}g
        </span>
        <span className="text-zinc-400 text-sm">
          {' '} / {displayTarget.toLocaleString('fr-FR')}g
        </span>
      </div>
      <div className="text-xs mt-1 text-center min-h-[16px]">
        {extra ? extra : <>&nbsp;</>}
      </div>
    </div>
  );
}

export default function MacrosRingDashboard({ user, log, className = "" }) {
  const stepsCalories = Math.max(0, log.steps - 4000) * CALORIES_PER_STEP;
  const extraCarbs = Math.floor(stepsCalories / 4);
  const macros = [
    {
      label: "Protéines",
      value: Math.round(log.totalProtein),
      goal: Math.round(user.dailyProtein),
      color: macroColors.Protéines,
    },
    {
      label: "Glucides",
      value: Math.round(log.totalCarbs),
      goal: Math.round(user.dailyCarbs),
      color: macroColors.Glucides,
      bonus: extraCarbs > 0 ? `+${Math.round(extraCarbs)}g après activité` : undefined,
    },
    {
      label: "Lipides",
      value: Math.round(log.totalFat),
      goal: Math.round(user.dailyFat),
      color: macroColors.Lipides,
    },
  ];
  return (
    <div className={`bg-[#222B3A] rounded-3xl p-4 pt-6 w-full max-w-2xl mx-auto shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Macronutriments</h2>
      <div className="flex justify-between gap-2 w-full flex-nowrap">
        {macros.map((m) => (
          <MacroCircle
            key={m.label}
            percent={Math.round((m.value / m.goal) * 100)}
            color={m.color}
            value={m.value}
            target={m.goal}
            label={m.label}
            extra={m.bonus}
          />
        ))}
      </div>
    </div>
  );
}
