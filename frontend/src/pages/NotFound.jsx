import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-24 h-24 mb-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-4xl shadow-sm">
        🔍
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Página Não Encontrada</h2>
      <p className="text-lg text-gray-600 max-w-md mb-8">
        Ops! A página que você está procurando não existe, foi movida ou está temporariamente indisponível.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-brand-600 text-white font-bold rounded-lg shadow-md hover:bg-brand-700 transition-colors"
      >
        Voltar para a Página Inicial
      </Link>
    </div>
  );
}
