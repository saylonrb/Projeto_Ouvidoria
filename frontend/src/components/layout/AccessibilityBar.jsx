import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import Button from '../ui/Button';

export default function AccessibilityBar() {
  const { toggleHighContrast, increaseFontSize, decreaseFontSize, resetFontSize } = useAccessibility();

  return (
    <div className="accessibility-bar" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 'var(--z-sticky)',
      background: 'var(--bg-elevated)',
      padding: 'var(--space-2)',
      borderRadius: 'var(--radius-full)',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      gap: 'var(--space-2)',
      border: '1px solid var(--border-subtle)'
    }}>
      <Button variant="ghost" size="sm" onClick={decreaseFontSize} aria-label="Diminuir fonte" title="Diminuir fonte">
        -A
      </Button>
      <Button variant="ghost" size="sm" onClick={resetFontSize} aria-label="Fonte normal" title="Fonte normal">
        A
      </Button>
      <Button variant="ghost" size="sm" onClick={increaseFontSize} aria-label="Aumentar fonte" title="Aumentar fonte">
        +A
      </Button>
      <div style={{ width: '1px', background: 'var(--border-subtle)' }}></div>
      <Button variant="ghost" size="sm" onClick={toggleHighContrast} aria-label="Alternar alto contraste" title="Alto contraste">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2v20"></path>
        </svg>
      </Button>
    </div>
  );
}
