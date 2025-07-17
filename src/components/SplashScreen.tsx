import React from 'react';

const SplashScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
    <div className="text-3xl font-bold mb-4">NutriTalk</div>
    <div className="animate-pulse">Chargement...</div>
  </div>
);

export default SplashScreen;
