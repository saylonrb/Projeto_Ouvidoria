import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
  };

  const badgeClass = variantClasses[variant] || variantClasses.neutral;

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {children}
    </span>
  );
}
