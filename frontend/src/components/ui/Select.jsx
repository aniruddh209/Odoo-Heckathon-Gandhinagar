import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  label,
  id,
  options = [],
  error,
  helperText,
  className = '',
  required = false,
  disabled = false,
  placeholder,
  children,
  ...props
}, ref) => {
  const selectId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-xs">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={`
            block w-full appearance-none rounded-lg border text-sm text-slate-900
            transition-colors duration-150 pl-3 pr-9 py-2 h-9 bg-white
            ${error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
            }
            ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.length > 0
            ? options.map((opt) => (
                <option
                  key={typeof opt === 'object' ? opt.value : opt}
                  value={typeof opt === 'object' ? opt.value : opt}
                >
                  {typeof opt === 'object' ? opt.label : opt}
                </option>
              ))
            : children}
        </select>

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
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

Select.displayName = 'Select';
export default Select;
