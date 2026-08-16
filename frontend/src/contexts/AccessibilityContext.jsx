import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext({});

export function AccessibilityProvider({ children }) {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });
  const [fontScale, setFontScale] = useState(() => {
    return parseFloat(localStorage.getItem('fontScale')) || 1;
  });

  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('highContrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale);
    localStorage.setItem('fontScale', fontScale);
  }, [fontScale]);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  
  const increaseFontSize = () => setFontScale(prev => Math.min(prev + 0.1, 1.5));
  const decreaseFontSize = () => setFontScale(prev => Math.max(prev - 0.1, 0.8));
  const resetFontSize = () => setFontScale(1);

  return (
    <AccessibilityContext.Provider value={{ 
      highContrast, 
      toggleHighContrast, 
      fontScale, 
      increaseFontSize, 
      decreaseFontSize,
      resetFontSize
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (Object.keys(context).length === 0) {
    throw new Error('useAccessibility deve ser usado dentro de um AccessibilityProvider');
  }
  return context;
}
