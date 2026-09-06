import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const MetricCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default', // 'default', 'primary', 'success', 'warning', 'danger', 'purple'
  trend,
  onClick,
  className = '',
  isCurrency = false,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className={`p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-3 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-slate-200/80 rounded" />
          <div className="w-7 h-7 bg-slate-200/80 rounded-lg" />
        </div>
        <div className="h-7 w-28 bg-slate-200/80 rounded" />
        <div className="h-3 w-16 bg-slate-200/80 rounded" />
      </div>
    );
  }

  const iconVariants = {
    default: 'bg-slate-50 text-slate-600 border-slate-200/80',
    primary: 'bg-blue-50 text-blue-600 border-blue-200/80',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-600 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-600 border-rose-200/80',
    purple: 'bg-purple-50 text-purple-600 border-purple-200/80',
  };

  const displayValue = isCurrency && typeof value === 'number'
    ? formatCurrency(value)
    : value;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              iconVariants[variant] || iconVariants.default
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate">
        {displayValue}
      </div>

      {(subtext || trend) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
          {trend && (
            <span
              className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span className="truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
