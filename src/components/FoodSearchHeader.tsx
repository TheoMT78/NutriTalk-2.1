import React from 'react';
import { QrCode, Plus } from 'lucide-react';

interface FoodSearchHeaderProps {
  onScan?: () => void;
  onAdd?: () => void;
}

export default function FoodSearchHeader({ onScan, onAdd }: FoodSearchHeaderProps) {
  return (
    <div className="bg-[#181e27] rounded-2xl p-5 mb-6 shadow-lg flex flex-col items-center w-full">
      <h1 className="text-3xl font-bold text-white text-center">Recherche d’aliments</h1>
      <div className="w-14 border-b-2 border-blue-500 my-2 mx-auto" />
      <div className="flex gap-4 w-full mt-4 flex-wrap">
        <button
          className="flex items-center justify-center flex-1 min-w-[160px] bg-[#22b573] text-white text-base rounded-xl py-3 font-semibold shadow hover:bg-[#28c77c] transition"
          onClick={onScan}
        >
          <QrCode size={22} className="mr-2" />
          Scanner
        </button>
        <button
          className="flex items-center justify-center flex-1 min-w-[160px] bg-[#3086ff] text-white text-base rounded-xl py-3 font-semibold shadow hover:bg-[#399eff] transition"
          onClick={onAdd}
        >
          <Plus size={22} className="mr-2" />
          Ajouter un aliment
        </button>
      </div>
    </div>
  );
}
