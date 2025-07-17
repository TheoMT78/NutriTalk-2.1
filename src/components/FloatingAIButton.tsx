import React from 'react';
import { MessageCircle, Mic } from 'lucide-react';

interface FloatingAIButtonProps {
  onClick: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 z-50 group"
      title="Assistant IA NutriTalk"
    >
      <div className="flex items-center space-x-2">
        <MessageCircle size={24} />
        <div className="hidden group-hover:block">
          <Mic size={20} className="animate-pulse" />
        </div>
      </div>
      
      {/* Effet d'ondulation */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-30 transform scale-110 transition-all duration-300" />
      
      {/* Indicateur de disponibilité */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
    </button>
  );
};

export default FloatingAIButton;