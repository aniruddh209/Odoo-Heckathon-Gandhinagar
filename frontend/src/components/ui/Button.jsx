import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  fullWidth = false,
  icon: Icon,
  rightIcon: RightIcon,
  className = '',
  onClick,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] shrink-0';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/20 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 hover:shadow-sm hover:shadow-blue-500/25 active:from-blue-700 active:to-indigo-700 focus-visible:ring-blue-500 border border-blue-500/30',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-400 border border-slate-200/80 shadow-2xs',
    outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:bg-slate-100 shadow-2xs focus-visible:ring-blue-500',
    danger: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xs shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 active:from-rose-700 active:to-rose-800 focus-visible:ring-rose-500 border border-rose-500/30',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 active:from-emerald-700 active:to-teal-800 focus-visible:ring-emerald-500 border border-emerald-500/30',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 focus-visible:ring-amber-500 border border-amber-500/30',
    soft: 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200/80 focus-visible:ring-blue-400 border border-blue-200/70 shadow-2xs',
    'soft-primary': 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200/80 focus-visible:ring-blue-400 border border-blue-200/70 shadow-2xs',
    'soft-success': 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200/80 focus-visible:ring-emerald-400 border border-emerald-200/70 shadow-2xs',
    'soft-danger': 'bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200/80 focus-visible:ring-rose-400 border border-rose-200/70 shadow-2xs',
    'soft-warning': 'bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200/80 focus-visible:ring-amber-400 border border-amber-200/70 shadow-2xs',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/80 focus-visible:ring-slate-400',
    link: 'text-blue-600 hover:text-blue-700 hover:underline p-0 h-auto font-medium focus-visible:ring-0',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 gap-1.5 h-7',
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2 gap-2 h-9',
    lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${widthStyle} ${className}`}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={`${size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />}
          {children && <span>{children}</span>}
          {RightIcon && <RightIcon className={`${size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
