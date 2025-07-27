import React, { useState } from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteRecipeSheet: React.FC<Props> = ({ show, onClose, onDelete }) => {
  const [confirm, setConfirm] = useState(false);
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#222B3A] w-full rounded-t-2xl p-4 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {confirm ? (
          <>
            <p className="text-gray-200 text-sm text-center">
              Êtes-vous sûr ? Retirer cette recette supprimera définitivement des recettes et des publications enregistrées sur votre profil.
            </p>
            <button
              onClick={() => {
                onDelete();
                setConfirm(false);
                onClose();
              }}
              className="w-full py-2 bg-red-600 text-white rounded-lg"
            >
              Supprimer
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-700 text-white rounded-lg"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirm(true)}
              className="w-full py-2 bg-red-600 text-white rounded-lg"
            >
              Supprimer la recette
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteRecipeSheet;
