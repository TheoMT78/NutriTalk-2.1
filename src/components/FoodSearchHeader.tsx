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
      <div className="w-12 border-b-2 border-blue-500 my-2 mx-auto" />
      <div className="flex gap-4 w-full mt-4">
        <button
          className="flex items-center flex-1 justify-center bg-[#22b573] text-white text-lg rounded-xl py-3 font-semibold shadow transition hover:scale-[1.03]"
          onClick={onScan}
        >
          <QrCode size={24} className="mr-2" />
          Scanner
        </button>
        <button
          className="flex items-center flex-1 justify-center bg-[#3086ff] text-white text-lg rounded-xl py-3 font-semibold shadow transition hover:scale-[1.03]"
          onClick={onAdd}
        >
          <Plus size={24} className="mr-2" />
          Ajouter <span className="text-sm ml-1 font-normal">un aliment</span>
        </button>
      </div>
    </div>
  );
}
