import React from 'react';
import { cn } from '../../utils/cn.js';

export const Card = ({
  children,
  className,
  title,
  subtitle,
  action,
  headerBorder = true,
  ...props
}) => {
  return (
    <div
      className={cn('bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden', className)}
      {...props}
    >
      {(title || action) && (
        <div
          className={cn(
            'px-5 py-3.5 flex items-center justify-between',
            headerBorder && 'border-b border-slate-100'
          )}
        >
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
