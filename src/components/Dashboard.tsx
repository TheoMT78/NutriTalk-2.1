import { PieChart, Pie, Cell } from "recharts";
import { Home, Search, BookOpen, BarChart2, User } from "lucide-react";
import FloatingAIButton from "./FloatingAIButton";
import { CALORIES_PER_STEP } from "./StepProgress";
import { DailyLog, User as UserType } from "../types";

const macroColors = {
  protein: "#22c55e",
  carbs: "#f59e42",
  fat: "#a78bfa",
};
const bgCard = "bg-[#171E2C]";

function MacroPie({ percent, color }: { percent: number; color: string }) {
  const data = [
    { value: percent, color },
    { value: 100 - percent, color: "#232b3c" },
  ];
  return (
    <PieChart width={70} height={70}>
      <Pie
        data={data}
        startAngle={90}
        endAngle={-270}
        innerRadius={24}
        outerRadius={35}
        dataKey="value"
        stroke="none"
      >
        {data.map((entry, i) => (
          <Cell key={i} fill={entry.color} />
        ))}
      </Pie>
      <text
        x={35}
        y={38}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        fill="#fff"
        fontWeight={700}
      >{`${percent}%`}</text>
    </PieChart>
  );
}

interface NavButtonProps {
  icon: JSX.Element;
  label: string;
  active?: boolean;
}
function NavButton({ icon, label, active }: NavButtonProps) {
  return (
    <button className={`flex flex-col items-center justify-center text-xs ${active ? "text-green-400" : "text-gray-400"}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface DashboardProps {
  dailyLog: DailyLog;
  user: UserType;
  onAssistantClick: () => void;
}

export default function Dashboard({ dailyLog, user, onAssistantClick }: DashboardProps) {
  const protein = dailyLog.totalProtein || 0;
  const proteinTarget = user.dailyProtein || 1;
  const proteinPct = Math.min(100, Math.round((protein / proteinTarget) * 100));

  const carbs = dailyLog.totalCarbs || 0;
  const carbsTarget = user.dailyCarbs || 1;
  const bonusCarbs = Math.round(Math.max(0, dailyLog.steps - 4000) * CALORIES_PER_STEP / 4);
  const carbsPct = Math.min(100, Math.round((carbs / carbsTarget) * 100));

  const fat = dailyLog.totalFat || 0;
  const fatTarget = user.dailyFat || 1;
  const fatPct = Math.min(100, Math.round((fat / fatTarget) * 100));

  return (
    <div className="min-h-screen bg-[#121826] pb-24 flex flex-col relative">
      <div className="px-4 pt-6 pb-2">
        <input
          type="text"
          placeholder="Rechercher une recette ou un aliment"
          className="w-full rounded-xl px-4 py-3 bg-[#232b3c] text-white placeholder-gray-400 border-none outline-none"
        />
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-r from-green-400 to-blue-400 p-5">
        <div className="text-white text-xl font-bold mb-1">Bonjour {user.name || ""} !</div>
        <div className="text-white text-base">
          Il vous reste <b>{user.dailyCalories - (dailyLog.totalCalories || 0)}</b> calories aujourd'hui
        </div>
      </div>

      <div className={`mx-4 rounded-2xl ${bgCard} p-4 mb-4`}>
        <div className="text-white font-bold text-lg mb-2 text-center">Macronutriments</div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center flex-1">
            <MacroPie percent={proteinPct} color={macroColors.protein} />
            <div className="text-white font-bold mt-1">Protéines</div>
            <div className="text-white text-lg font-bold">
              {protein}g <span className="text-gray-400 text-base font-normal">/ {proteinTarget}g</span>
            </div>
          </div>
          <div className="flex flex-col items-center flex-1">
            <MacroPie percent={carbsPct} color={macroColors.carbs} />
            <div className="text-white font-bold mt-1">Glucides</div>
            <div className="text-white text-lg font-bold">
              {carbs}g <span className="text-gray-400 text-base font-normal">/ {carbsTarget}g</span>
            </div>
            <div className="text-blue-300 text-xs">+{bonusCarbs}g après activité</div>
          </div>
          <div className="flex flex-col items-center flex-1">
            <MacroPie percent={fatPct} color={macroColors.fat} />
            <div className="text-white font-bold mt-1">Lipides</div>
            <div className="text-white text-lg font-bold">
              {fat}g <span className="text-gray-400 text-base font-normal">/ {fatTarget}g</span>
            </div>
          </div>
        </div>
      </div>

      <FloatingAIButton onClick={onAssistantClick} />

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#171E2C] flex justify-between items-center px-6 z-40 shadow-2xl">
        <NavButton icon={<Home />} label="Tableau de bord" active />
        <NavButton icon={<Search />} label="Recherche" />
        <NavButton icon={<BookOpen />} label="Recette" />
        <NavButton icon={<BarChart2 />} label="Historique" />
        <NavButton icon={<User />} label="Profil" />
      </nav>
    </div>
  );
}
