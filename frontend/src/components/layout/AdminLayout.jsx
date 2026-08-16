import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AccessibilityBar from './AccessibilityBar';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/demandas', label: 'Demandas' },
    { path: '/admin/tickets-ia', label: 'Demandas Agrupadas' },
    { path: '/admin/usuarios', label: 'Usuários', roles: ['SUPER_ADMIN'] },
    { path: '/admin/setores', label: 'Setores & Cat.', roles: ['SUPER_ADMIN'] },
    { path: '/admin/auditoria', label: 'Auditoria', roles: ['SUPER_ADMIN'] },
    { path: '/api/docs', label: 'API Docs', external: true }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed top-0 bottom-0 z-40 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-md bg-brand-600 text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-gray-800 text-sm leading-tight uppercase">
                Admin
              </span>
              <span className="font-bold text-brand-600 text-xs leading-tight uppercase">
                Ouvidoria
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="flex flex-col gap-1.5">
            {menuItems.map(item => {
              if (item.roles && !item.roles.includes(user?.role)) return null;
              
              if (item.external) {
                return (
                  <li key={item.path}>
                    <a 
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg transition-colors text-xs font-semibold uppercase tracking-wider text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <span>{item.label}</span>
                      <span className="text-gray-400">↗</span>
                    </a>
                  </li>
                );
              }

              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-lg transition-colors text-xs font-semibold uppercase tracking-wider ${
                      isActive 
                        ? 'bg-brand-50 text-brand-700 font-bold border-l-4 border-brand-600' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-gray-800 truncate text-sm">{user?.name}</div>
              <div className="text-xs text-brand-600 font-semibold">{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 bg-gray-50">
        <Outlet />
      </main>

      <AccessibilityBar />
    </div>
  );
}
