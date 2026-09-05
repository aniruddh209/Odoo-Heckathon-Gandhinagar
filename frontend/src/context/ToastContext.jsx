import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'success', duration = 4000 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, message) => addToast({
      title: message ? title : 'Success',
      message: message || (typeof title === 'string' ? title : ''),
      type: 'success',
    }),
    error: (title, message) => addToast({
      title: message ? title : 'Error',
      message: message || (typeof title === 'string' ? title : 'An unexpected error occurred.'),
      type: 'error',
      duration: 6000,
    }),
    info: (title, message) => addToast({
      title: message ? title : 'Notice',
      message: message || (typeof title === 'string' ? title : ''),
      type: 'info',
    }),
    showSuccess: (message, title = 'Success') => addToast({
      title: typeof title === 'string' && title !== 'Success' ? title : 'Success',
      message: typeof message === 'string' ? message : (message?.message || 'Action completed successfully.'),
      type: 'success',
    }),
    showError: (message, title = 'Error') => addToast({
      title: typeof title === 'string' && title !== 'Error' ? title : 'Error',
      message: typeof message === 'string' ? message : (message?.message || 'Action could not be completed.'),
      type: 'error',
      duration: 6000,
    }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
          };

          const borders = {
            success: 'border-emerald-200 bg-white shadow-lg',
            error: 'border-rose-200 bg-white shadow-lg',
            info: 'border-blue-200 bg-white shadow-lg',
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border ${borders[t.type] || borders.info} animate-in slide-in-from-bottom-5 duration-200`}
              role="status"
            >
              <div className="flex items-start gap-3">
                {icons[t.type] || icons.info}
                <div>
                  <h5 className="text-xs font-semibold text-slate-900">{t.title}</h5>
                  {t.message && (
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t.message}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
