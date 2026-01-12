import React from 'react';

/**
 * Reusable Button Component
 * 
 * @param {string} variant - Button style variant: 'primary', 'secondary', 'text', 'textGray', 'icon'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} fullWidth - Whether button should take full width
 * @param {boolean} loading - Whether button is in loading state
 * @param {boolean} disabled - Whether button is disabled
 * @param {React.ReactNode} children - Button content
 * @param {string} className - Additional CSS classes
 * @param {Object} props - Other button props (onClick, type, etc.)
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  // Base classes that apply to all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    text: 'text-red-600 hover:text-red-700 focus:ring-red-500 bg-transparent',
    textGray: 'text-gray-600 hover:text-red-600 focus:ring-gray-500 bg-transparent',
    icon: 'text-gray-600 hover:text-red-600 focus:ring-gray-500 bg-transparent p-1',
    danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50 focus:ring-red-500',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-4 py-2 text-base rounded-lg',
    icon: 'p-1 rounded',
  };
  
  // Determine size class (icon variant uses icon size, otherwise use provided size)
  const sizeClass = variant === 'icon' ? sizeClasses.icon : sizeClasses[size];
  
  // Combine all classes
  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClass,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      )}
      {children}
    </button>
  );
};

export default Button;
