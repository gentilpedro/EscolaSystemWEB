import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-2xl text-blue-100 mb-8">Página não encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-white hover:bg-gray-100 text-blue-600 px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Voltar para Home</span>
        </Link>
      </div>
    </div>
  );
};
