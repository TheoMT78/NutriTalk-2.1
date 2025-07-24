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
}) {
  const percent = Math.min(Math.round((value / goal) * 100), 100);
  const data = [
    { value: percent },
    { value: 100 - percent }
  ];
  return (
    <div className="flex flex-col items-center mx-3">
      <PieChart width={120} height={120}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          startAngle={90}
          endAngle={-270}
          innerRadius={44}
          outerRadius={58}
          dataKey="value"
          stroke="none"
        >
          <Cell key="filled" fill={color} />
          <Cell key="empty" fill="#232e46" />
        </Pie>
        <text
          x={60}
          y={68}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="28"
          fontWeight="bold"
          fill="#fff"
        >
          {percent}%
        </text>
      </PieChart>
      <div className="text-white text-lg font-semibold mt-[-18px]">{label}</div>
      <div className="text-gray-300 text-xl font-bold">
        {value}{unit}
        <span className="text-gray-400 font-normal text-base"> / {goal}{unit}</span>
      </div>
      {bonus && label === "Glucides" && (
        <div className="text-blue-200 text-sm mt-1">{bonus}</div>
      )}
    </div>
  );
}

export default function MacrosRingDashboard() {
  // Exemple de données fictives
  const macros = [
    { label: "Protéines", value: 4, goal: 197, color: macroColors.Protéines },
    { label: "Glucides", value: 22, goal: 393, color: macroColors.Glucides, bonus: "+20g après activité" },
    { label: "Lipides", value: 2, goal: 87, color: macroColors.Lipides },
  ];
  return (
    <div className="bg-[#161d2d] rounded-3xl p-7 flex flex-col items-center w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6 tracking-wide">Macronutriments</h2>
      <div className="flex flex-row justify-center w-full gap-8">
        {macros.map((macro) => (
          <MacroRing key={macro.label} {...macro} />
        ))}
      </div>
    </div>
  );
}
