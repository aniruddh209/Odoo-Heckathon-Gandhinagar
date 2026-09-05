import React from 'react';

export const Input = React.forwardRef(({
  label,
  id,
  error,
  helperText,
  icon: Icon,
  endIcon: EndIcon,
  className = '',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          className={`
            block w-full rounded-lg border text-sm text-slate-900 placeholder:text-slate-400
            transition-colors duration-150 py-2 h-9
            ${Icon ? 'pl-9' : 'pl-3'}
            ${EndIcon ? 'pr-9' : 'pr-3'}
            ${error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white'
            }
            ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : ''}
            ${className}
          `}
          {...props}
        />

        {EndIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <EndIcon className="w-4 h-4" />
          </div>
        )}
      </div>

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

Input.displayName = 'Input';
export default Input;
