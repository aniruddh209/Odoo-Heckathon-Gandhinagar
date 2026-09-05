import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error' | 'danger';
  variant?: 'info' | 'success' | 'warning' | 'error' | 'danger';
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  variant,
  title,
  message,
  children,
  onDismiss,
  onClose,
  className,
}) => {
  const resolvedType = (variant === 'danger' ? 'error' : variant) || (type === 'danger' ? 'error' : type) || 'info';
  const handleClose = onClose || onDismiss;

  const configs = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    },
  };

  const config = configs[resolvedType as keyof typeof configs] || configs.info;

  return (
    <div
      className={twMerge(
        clsx('flex items-start gap-3 p-3.5 rounded-lg border text-sm', config.bg, className)
      )}
      role="alert"
    >
      {config.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold">{title}</h4>}
        {message && <p className={title ? 'mt-0.5 text-xs opacity-90' : 'text-xs'}>{message}</p>}
        {children && <div className="mt-1 text-xs">{children}</div>}
      </div>
      {handleClose && (
        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
