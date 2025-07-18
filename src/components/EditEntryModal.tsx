import React from 'react';
import { X } from 'lucide-react';
import { FoodEntry } from '../types';

interface EditEntryModalProps {
  entry: FoodEntry;
  onSave: (entry: FoodEntry) => void;
  onClose: () => void;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ entry, onSave, onClose }) => {
  const [form, setForm] = React.useState(() => ({
    quantity: Math.round(entry.quantity * 10) / 10,
    unit: entry.unit,
  }));

  React.useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    const rounded = Math.round((value || 0) * 10) / 10;
    setForm(prev => ({ ...prev, [field]: rounded }));
  };

  const handleSave = () => {
    const roundedQty = Math.round(form.quantity * 10) / 10;
    onSave({ ...entry, quantity: roundedQty, unit: form.unit });
  };

  const stop = (e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4 w-full max-w-sm"
        onClick={stop}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Modifier l\'entrée</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="space-y-1">
            <span>Quantité</span>
            <input
              type="number"
              value={form.quantity}
              onChange={handleChange('quantity')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
            />
          </label>
          <label className="space-y-1">
            <span>Unité</span>
            <input
              type="text"
              value={form.unit}
              onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
            />
          </label>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Annuler</button>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEntryModal;
