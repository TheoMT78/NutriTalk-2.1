import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

const periods = [
  { id: 'day', label: 'Quotidien' },
  { id: 'week', label: 'Hebdomadaire' },
  { id: 'month', label: 'Mensuel' },
];

interface PeriodSelectorProps {
  period: string;
  setPeriod: (p: string) => void;
  month: number;
  setMonth: (m: number) => void;
  year: number;
  setYear: (y: number) => void;
  className?: string;
}

export default function PeriodSelector({
  period = 'month',
  setPeriod,
  month = 6,
  setMonth,
  year = 2025,
  setYear,
  className = '',
}: PeriodSelectorProps) {
  const monthNames = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  return (
    <div className={`bg-[#222B3A] rounded-2xl p-4 shadow-lg w-full flex flex-col gap-2 ${className}`}>
      <div className="text-center text-sm font-semibold tracking-wide text-blue-100 mb-1">
        Période d’analyse
      </div>
      <div className="flex items-center justify-center gap-2">
        <Calendar className="text-blue-400" size={20} />
        <button className="hover:bg-[#273149] rounded-full p-1 transition" onClick={prevMonth}>
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-white text-lg">
          {monthNames[month]} {year}
        </span>
        <button className="hover:bg-[#273149] rounded-full p-1 transition" onClick={nextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="flex justify-center gap-2 mt-1">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-1 rounded-full font-semibold transition text-sm ${
              period === p.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-[#273149] text-gray-300 hover:bg-blue-700 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
