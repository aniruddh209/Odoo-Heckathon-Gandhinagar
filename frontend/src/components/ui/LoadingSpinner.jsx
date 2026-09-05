import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 text-slate-500 ${className}`}>
      <Loader2 className={`${sizes[size] || sizes.md} animate-spin text-blue-600`} />
      {message && <span className="text-xs font-medium text-slate-600">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
