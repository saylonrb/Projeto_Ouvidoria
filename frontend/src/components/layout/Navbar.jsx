import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo Institucional */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-brand-500 text-white font-bold shadow-md group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-gray-800 text-lg leading-tight tracking-tight uppercase">
              Prefeitura de
            </span>
            <span className="font-extrabold text-brand-500 text-xl leading-tight tracking-tight uppercase">
              Parauapebas
            </span>
          </div>
        </Link>

        {/* Links Principais (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/nova-demanda" className="text-gray-600 font-medium hover:text-brand-500 transition-colors">Nova Demanda</Link>
          <Link to="/demandas-publicas" className="text-gray-600 font-medium hover:text-brand-500 transition-colors">Consultar Demandas</Link>
          <Link to="/rastrear" className="text-gray-600 font-medium hover:text-brand-500 transition-colors">Rastrear</Link>
          <Link to="/faq" className="text-gray-600 font-medium hover:text-brand-500 transition-colors">Ajuda</Link>

          {/* Área do Usuário */}
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            {user ? (
              <>
                <Link to="/minha-area">
                  <button className="px-4 py-2 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors">Minha Área</button>
                </Link>
                {['ATTENDANT', 'SECTOR_MANAGER', 'SUPER_ADMIN'].includes(user.role) && (
                  <Link to="/admin">
                    <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Painel Admin</button>
                  </Link>
                )}
                <button onClick={logout} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">Sair</button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors">Entrar</button>
                </Link>
                <Link to="/login?register=true">
                  <button className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/30 rounded-lg transition-all hover:-translate-y-0.5">Cadastrar</button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-gray-600 hover:text-brand-500 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex flex-col gap-4 shadow-lg animate-fadeIn">
          <Link to="/nova-demanda" className="text-gray-700 font-medium hover:text-brand-500">Nova Demanda</Link>
          <Link to="/demandas-publicas" className="text-gray-700 font-medium hover:text-brand-500">Consultar Demandas</Link>
          <Link to="/rastrear" className="text-gray-700 font-medium hover:text-brand-500">Rastrear</Link>
          <Link to="/faq" className="text-gray-700 font-medium hover:text-brand-500">Ajuda</Link>
          <hr className="border-gray-100" />
          {user ? (
            <div className="flex flex-col gap-2">
              <Link to="/minha-area" className="w-full text-center py-2 bg-brand-50 text-brand-600 rounded-lg font-medium">Minha Área</Link>
              {['ATTENDANT', 'SECTOR_MANAGER', 'SUPER_ADMIN'].includes(user.role) && (
                <Link to="/admin" className="w-full text-center py-2 border border-gray-200 text-gray-700 rounded-lg font-medium">Painel Admin</Link>
              )}
              <button onClick={logout} className="w-full text-center py-2 text-gray-500 font-medium">Sair</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" className="w-full text-center py-2 border border-gray-200 text-gray-700 rounded-lg font-medium">Entrar</Link>
              <Link to="/login?register=true" className="w-full text-center py-2 bg-brand-500 text-white rounded-lg font-medium shadow-md shadow-brand-500/30">Cadastrar</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

