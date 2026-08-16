import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica sessão ao iniciar
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.warn('Sessão expirada ou inválida ao inicializar:', error.message);
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { user, accessToken } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
    return user;
  };

  const googleLogin = async (idToken) => {
    const response = await api.post('/auth/google', { idToken });
    const { user, accessToken } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Erro ao chamar logout da API', e);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      // Redireciona para o login forçando refresh do app state
      window.location.href = '/login';
    }
  };

  const updateUserProfile = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (Object.keys(context).length === 0) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
