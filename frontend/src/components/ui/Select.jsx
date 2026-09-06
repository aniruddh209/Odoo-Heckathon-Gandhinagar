import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, AlertCircle } from 'lucide-react';

export const Select = React.forwardRef(({
  label,
  id,
  options = [],
  value,
  onChange,
  error,
  helperText,
  className = '',
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyText = 'No options found',
  isLoading = false,
  name,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listboxRef = useRef(null);

  const selectId = id || name || Math.random().toString(36).substring(2, 9);
  
  // Normalize options to handle both strings and objects
  const normalizedOptions = options.map(opt => 
    typeof opt === 'object' ? opt : { label: opt, value: opt }
  );

  const filteredOptions = searchable && searchQuery
    ? normalizedOptions.filter(opt => 
        opt.label?.toString().toLowerCase().includes(searchQuery.toLowerCase()) || 
        opt.description?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    : normalizedOptions;

  const isOptionSelected = (optVal, val) => {
    if (optVal === val) return true;
    if (optVal !== undefined && optVal !== null && val !== undefined && val !== null && val !== '') {
      return String(optVal) === String(val);
    }
    return false;
  };

  const selectedOption = normalizedOptions.find(opt => isOptionSelected(opt.value, value));

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setFocusedIndex(filteredOptions.findIndex(opt => isOptionSelected(opt.value, value)));
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current.focus(), 50);
      }
    }
  }, [isOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    
    // Create synthetic event to maintain backward compatibility
    if (onChange) {
      const event = {
        target: { name, value: optionValue },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      onChange(event);
    }
    
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          e.preventDefault();
          handleSelect(filteredOptions[focusedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          id={`${selectId}-label`}
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={ref}
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${selectId}-label ${selectId}` : selectId}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={`
            relative w-full flex items-center justify-between text-left
            rounded-lg border text-sm transition-all duration-150 pl-3 pr-9 py-2 min-h-[36px] bg-white shadow-xs
            ${error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
            }
            ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-70' : 'cursor-pointer'}
            ${isOpen ? (error ? 'ring-1 ring-rose-500 border-rose-500' : 'ring-1 ring-blue-500 border-blue-500') : ''}
          `}
          {...props}
        >
          <span className={`block truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden transform opacity-100 scale-100 transition-all origin-top">
            {searchable && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                        handleKeyDown(e);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <ul
              ref={listboxRef}
              role="listbox"
              tabIndex="-1"
              className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent focus:outline-none"
            >
              {isLoading ? (
                <li className="px-3 py-4 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Loading options...
                </li>
              ) : filteredOptions.length === 0 ? (
                <li className="px-3 py-4 text-xs text-slate-500 text-center flex flex-col items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-slate-300" />
                  <span>{emptyText}</span>
                </li>
              ) : (
                filteredOptions.map((opt, index) => {
                  const isSelected = isOptionSelected(opt.value, value);
                  const isFocused = index === focusedIndex;

                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={`
                        relative px-3 py-2 cursor-pointer select-none mx-1 rounded-md text-sm transition-colors
                        ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}
                        ${isFocused && !isSelected ? 'bg-slate-100 text-slate-900' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="block truncate">{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                      </div>
                      {opt.description && (
                        <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-blue-500/80' : 'text-slate-400'}`}>
                          {opt.description}
                        </p>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5" />
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
