import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingAIButtonProps {
  onClick: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed z-50 right-4 bottom-20 md:bottom-8 bg-violet-500 hover:bg-violet-600 shadow-xl rounded-full w-16 h-16 flex items-center justify-center"
      style={{ boxShadow: '0 4px 24px 0 rgba(80,0,150,0.22)' }}
      aria-label="Ouvrir l'assistant IA"
    >
      <MessageCircle size={32} className="text-white" />
    </button>
  );
};

export default FloatingAIButton;