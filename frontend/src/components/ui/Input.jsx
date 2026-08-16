import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  hint,
  id,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-800 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/30'} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <div id={`${inputId}-error`} className="flex items-center gap-1 text-sm text-red-600" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
      {hint && !error && (
        <div id={`${inputId}-hint`} className="text-xs text-gray-500">
          {hint}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
