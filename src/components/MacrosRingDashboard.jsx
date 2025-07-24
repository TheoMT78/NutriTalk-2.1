import React from "react";
import { PieChart, Pie, Cell } from "recharts";

const macroColors = {
  Protéines: "#23e38d",
  Glucides: "#fbc150",
  Lipides: "#a783ff",
};

function MacroRing({
  label,
  value,
  goal,
  unit = "g",
  color,
  bonus,
  className = "",
}) {
  const percent = Math.min(Math.round((value / goal) * 100), 100);
  const data = [
    { value: percent },
    { value: 100 - percent }
  ];
  return (
    <div className={`flex flex-col items-center justify-center mb-4 sm:mb-0 sm:mx-4 ${className}`} style={{ minWidth: 110, maxWidth: 140 }}>
      <PieChart width={100} height={100}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          startAngle={90}
          endAngle={-270}
          innerRadius={38}
          outerRadius={48}
          dataKey="value"
          stroke="none"
        >
          <Cell key="filled" fill={color} />
          <Cell key="empty" fill="#232e46" />
        </Pie>
        {/* Le % au centre */}
        <text
          x={50}
          y={54}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="bold"
          fill="#fff"
        >
          {percent}%
        </text>
      </PieChart>
      {/* Le texte EN DESSOUS */}
      <div className="text-white text-base font-semibold mt-2">{label}</div>
      <div className="text-gray-300 text-lg font-bold">
        {value}{unit}
        <span className="text-gray-400 font-normal text-base"> / {goal}{unit}</span>
      </div>
      {bonus && label === "Glucides" && (
        <div className="text-blue-200 text-xs mt-1">{bonus}</div>
      )}
    </div>
  );
}

export default function MacrosRingDashboard({ className = "" }) {
  // Exemple de données fictives (à remplacer par les vraies)
  const macros = [
    { label: "Protéines", value: 4, goal: 197, color: macroColors.Protéines },
    { label: "Glucides", value: 22, goal: 393, color: macroColors.Glucides, bonus: "+20g après activité" },
    { label: "Lipides", value: 2, goal: 87, color: macroColors.Lipides },
  ];
  return (
    <div className={`bg-[#161d2d] rounded-3xl p-4 pt-6 w-full max-w-2xl mx-auto shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Macronutriments</h2>
      <div
        className="
          flex flex-col items-center w-full
          sm:flex-row sm:justify-center
        "
      >
        {macros.map((macro) => (
          <MacroRing key={macro.label} {...macro} />
        ))}
      </div>
    </div>
  );
}
