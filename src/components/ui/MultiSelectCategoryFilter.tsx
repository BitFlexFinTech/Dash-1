import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, X } from 'lucide-react';
import { DrinkCategory } from '../../types/bws';

export const ALL_DRINK_CATEGORIES: DrinkCategory[] = [
  'Wine',
  'Sparkling Wine',
  'Beer',
  'Vodka',
  'Rum',
  'Whisky & Whiskey',
  'Gin',
  'Agave Spirits',
  'Liqueurs & Aperitifs',
  'Sake & Specialty',
];

export const MultiSelectCategoryFilter: React.FC<{
  selected: DrinkCategory[];
  onChange: (next: DrinkCategory[]) => void;
  availableCategories?: DrinkCategory[];
  label?: string;
}> = ({
  selected,
  onChange,
  availableCategories = ALL_DRINK_CATEGORIES,
  label = 'Drink Categories',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleCategory = (cat: DrinkCategory) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border transition-colors cursor-pointer ${
          selected.length > 0
            ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-black dark:border-white font-medium'
            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-black dark:text-white'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <Filter className={`w-3.5 h-3.5 shrink-0 ${selected.length > 0 ? 'text-[#FF6A00]' : 'text-zinc-400'}`} />
          <span className="truncate">
            {selected.length === 0
              ? `All ${label}`
              : selected.length === 1
              ? selected[0]
              : `${selected.length} Categories Selected`}
          </span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-75" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 z-40 min-w-[240px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-200 dark:border-zinc-800 mb-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => onChange([...availableCategories])}
              className="font-semibold text-[#FF6A00] hover:underline cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              Clear ({selected.length})
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {availableCategories.map((cat) => {
              const checked = selected.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                    checked
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-medium'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`w-4 h-4 flex items-center justify-center border ${
                      checked
                        ? 'bg-[#FF6A00] border-[#FF6A00] text-white'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:border-[#FF6A00] cursor-pointer"
            >
              <span>{cat}</span>
              <X className="w-3 h-3 text-zinc-500 hover:text-[#FF6A00]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
