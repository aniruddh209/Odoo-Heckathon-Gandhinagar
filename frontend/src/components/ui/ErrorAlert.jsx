import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export const ErrorAlert = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-900 shadow-2xs ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          {message && (
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">{message}</p>
          )}
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="xs"
                onClick={onRetry}
                icon={RefreshCw}
                className="border-rose-300 text-rose-800 hover:bg-rose-100 hover:border-rose-400"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
