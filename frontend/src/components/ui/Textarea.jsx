import React from 'react';

export const Textarea = React.forwardRef(({
  label,
  id,
  error,
  helperText,
  className = '',
  required = false,
  disabled = false,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        className={`
          block w-full rounded-lg border text-sm text-slate-900 placeholder:text-slate-400
          transition-colors duration-150 p-3 bg-white
          ${error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
            : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
          }
          ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : ''}
          ${className}
        `}
        {...props}
      />

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
