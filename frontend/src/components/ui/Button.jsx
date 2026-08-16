import React, { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'lg', 
  fullWidth = false, 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg focus:ring-brand-500',
    secondary: 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 focus:ring-brand-500',
    ghost: 'bg-transparent text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md focus:ring-red-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-8 py-4 text-lg rounded-xl',
  };

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.lg,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      ref={ref}
      className={classes} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
