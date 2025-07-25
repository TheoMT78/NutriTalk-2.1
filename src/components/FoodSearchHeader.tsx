import React from 'react';
import { QrCode, Plus } from 'lucide-react';

interface FoodSearchHeaderProps {
  onScan?: () => void;
  onAdd?: () => void;
}

export default function FoodSearchHeader({ onScan, onAdd }: FoodSearchHeaderProps) {
  return (
    <div className="bg-[#222B3A] rounded-2xl p-4 mb-4 shadow flex flex-col items-center w-full max-w-[370px] mx-auto">
      <div className="w-full flex flex-col items-center mb-2">
        <span className="text-lg font-bold text-white tracking-tight mb-1">
          Recherche d'aliments
        </span>
        <div className="h-1 w-10 rounded-full bg-blue-500 opacity-60 mb-1" />
      </div>
      <div className="flex w-full gap-3">
        <button
          onClick={onScan}
          className="flex-1 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg py-2 transition text-sm shadow"
        >
          <QrCode size={20} className="mr-2" /> Scanner
        </button>
        <button
          onClick={onAdd}
          className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg py-2 transition text-sm shadow"
        >
          <Plus size={20} className="mr-2" /> Ajouter un aliment
        </button>
      </div>
    </div>
  );
}
