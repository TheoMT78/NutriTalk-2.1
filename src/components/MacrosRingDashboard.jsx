import React from "react";
import { PieChart, Pie, Cell } from "recharts";
import { CALORIES_PER_STEP } from "./StepProgress";

const macroColors = {
  Protéines: "#23e38d",
  Glucides: "#fbc150",
  Lipides: "#a783ff",
};

function MacroCircle({ percent, color, value, target, label, extra }) {
  const data = [
    { value: percent, fill: color },
    { value: 100 - percent, fill: "#242b3b" }
  ];
  return (
    <div className="flex flex-col items-center mx-2 w-24">
      <PieChart width={64} height={64}>
        <Pie
          data={data}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          innerRadius={22}
          outerRadius={32}
          stroke="none"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <text
          x={32}
          y={38}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={18}
          fill="#fff"
          fontWeight="bold"
        >{`${percent}%`}</text>
      </PieChart>
      <div className="mt-1 text-center font-bold">{label}</div>
      <div className="text-center">
        <span className="font-bold text-lg">{value}g</span>
        <span className="text-zinc-400 text-sm"> / {target}g</span>
      </div>
      {extra && <div className="text-xs text-blue-300">{extra}</div>}
    </div>
  );
}

export default function MacrosRingDashboard({ user, log, className = "" }) {
  const stepsCalories = Math.max(0, log.steps - 4000) * CALORIES_PER_STEP;
  const extraCarbs = Math.floor(stepsCalories / 4);
  const macros = [
    { label: "Protéines", value: log.totalProtein, goal: user.dailyProtein, color: macroColors.Protéines },
    { label: "Glucides", value: log.totalCarbs, goal: user.dailyCarbs, color: macroColors.Glucides, bonus: extraCarbs > 0 ? `+${extraCarbs}g après activité` : undefined },
    { label: "Lipides", value: log.totalFat, goal: user.dailyFat, color: macroColors.Lipides },
  ];
  return (
    <div className={`bg-[#161d2d] rounded-3xl p-4 pt-6 w-full max-w-2xl mx-auto shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Macronutriments</h2>
      <div className="flex flex-row justify-center items-end w-full">
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
