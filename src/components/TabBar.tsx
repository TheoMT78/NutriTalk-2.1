import React from 'react';
import { Home, Search, BookOpen, BarChart3, UserCircle } from 'lucide-react';

interface TabBarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'search', label: 'Recherche', icon: Search },
    { id: 'recipes', label: 'Recette', icon: BookOpen },
    { id: 'history', label: 'Historique', icon: BarChart3 },
    { id: 'profile', label: 'Profil', icon: UserCircle }
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-gray-700 bg-[#222B3A] text-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 64px)' }}
    >
      <nav className="flex justify-around py-2 pb-[64px]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 64px)' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center text-xs font-medium focus:outline-none transition-colors duration-200 ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon size={20} className="mb-1" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabBar;
