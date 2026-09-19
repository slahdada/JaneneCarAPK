import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';

interface CreatableComboboxProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  searchPlaceholder: string;
  createLabel: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  onChange: (value: string) => void;
  onCreate: (value: string) => { value: string; created: boolean };
  onCreateFeedback?: (value: string, created: boolean) => void;
}

export const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
  id,
  label,
  value,
  options,
  placeholder,
  searchPlaceholder,
  createLabel,
  required,
  disabled,
  helperText,
  error,
  onChange,
  onCreate,
  onCreateFeedback,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const [createValue, setCreateValue] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.trim();
  const normalizedCreateValue = createValue.trim();

  const filtered = useMemo(() => {
    const q = normalizedQuery.toLocaleLowerCase('fr');
    if (!q) return options;
    return options.filter((option) => option.toLocaleLowerCase('fr').includes(q));
  }, [options, normalizedQuery]);

  const exactMatch = useMemo(() => {
    if (!normalizedQuery) return '';
    const q = normalizedQuery.toLocaleLowerCase('fr');
    return options.find((option) => option.trim().toLocaleLowerCase('fr') === q) || '';
  }, [options, normalizedQuery]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
        setCreateMode(false);
        setCreateValue('');
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  useEffect(() => {
    if (createMode) {
      requestAnimationFrame(() => createRef.current?.focus());
    }
  }, [createMode]);

  const closeMenu = () => {
    setQuery('');
    setCreateMode(false);
    setCreateValue('');
    setOpen(false);
  };

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    closeMenu();
  };

  const createAndSelect = (rawValue: string) => {
    const input = rawValue.trim();
    if (!input) return;

    const existing = options.find(
      (option) => option.trim().toLocaleLowerCase('fr') === input.toLocaleLowerCase('fr')
    );
    if (existing) {
      selectValue(existing);
      onCreateFeedback?.(existing, false);
      return;
    }

    const result = onCreate(input);
    if (!result.value) return;

    // The newly created item is immediately selected, independently of the next
    // options refresh from localStorage. This avoids losing the value after creation.
    onChange(result.value);
    onCreateFeedback?.(result.value, result.created);
    closeMenu();
  };

  const startCreateMode = () => {
    // Reuse the search text when the user has already typed a missing brand/model.
    setCreateValue(normalizedQuery);
    setCreateMode(true);
  };

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="ui-label">
        {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
      </label>

      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={!!error}
        onClick={() => {
          if (disabled) return;
          if (open) {
            closeMenu();
          } else {
            setOpen(true);
            requestAnimationFrame(() => searchRef.current?.focus());
          }
        }}
        className={`ui-field flex min-h-11 items-center justify-between gap-3 text-left ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${error ? '!border-rose-400' : ''}`}
      >
        <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {helperText && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}

      {open && !disabled && (
        <div
          className="absolute z-[70] mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          {!createMode ? (
            <>
              <div className="border-b border-slate-100 p-2 dark:border-slate-700">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && normalizedQuery) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (exactMatch) selectValue(exactMatch);
                        else startCreateMode();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        closeMenu();
                      }
                    }}
                    placeholder={searchPlaceholder}
                    className="ui-field !py-2 pl-9 pr-9"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2 top-2.5 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      aria-label="Effacer la recherche"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div role="listbox" className="max-h-52 overflow-y-auto p-1">
                {filtered.length > 0 ? filtered.map((option) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={option === value}
                    key={option}
                    onClick={() => selectValue(option)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <span>{option}</span>
                    {option === value && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  </button>
                )) : (
                  <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">Aucun résultat.</p>
                )}
              </div>

              <div className="border-t border-slate-100 p-1 dark:border-slate-700">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startCreateMode();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50 active:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-950/50"
                >
                  <Plus className="h-4 w-4" />
                  {normalizedQuery && !exactMatch
                    ? `${createLabel} “${normalizedQuery}”`
                    : createLabel}
                </button>
              </div>
            </>
          ) : (
            <div className="p-3">
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{createLabel}</p>
              <input
                ref={createRef}
                type="text"
                value={createValue}
                onChange={(event) => setCreateValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    createAndSelect(createValue);
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setCreateMode(false);
                    setCreateValue('');
                    requestAnimationFrame(() => searchRef.current?.focus());
                  }
                }}
                placeholder={placeholder}
                className="ui-field"
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode(false);
                    setCreateValue('');
                    requestAnimationFrame(() => searchRef.current?.focus());
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!normalizedCreateValue}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    createAndSelect(createValue);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
