import React from 'react';
import { Menu, Moon, Sun, ArrowRight } from 'lucide-react';
import { NavSectionId } from '../../types/bws';
import { NAV_ITEMS } from './Sidebar';

export const TopBar: React.FC<{
  activeSection: NavSectionId;
  selectedCountryName?: string;
  selectedBrandName?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onNavigate: (section: NavSectionId) => void;
}> = ({
  activeSection,
  selectedCountryName,
  selectedBrandName,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
  onNavigate,
}) => {
  const currentItem = NAV_ITEMS.find((i) => i.id === activeSection) || NAV_ITEMS[0];

  const contextSuffix =
    activeSection === 'country-discovery' && selectedCountryName
      ? selectedCountryName
      : (activeSection === 'brand-intelligence' ||
          activeSection === 'uk-distribution' ||
          activeSection === 'amazon-uk' ||
          activeSection === 'pitch-targets' ||
          activeSection === 'opportunity-assessment') &&
        selectedBrandName
      ? selectedBrandName
      : null;

  return (
    <header className="h-14 sticky top-0 z-30 bg-white/95 dark:bg-[#050506]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile trigger + Breadcrumb trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
          <span className="font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap hidden sm:inline">
            {currentItem.group}
          </span>
          <span className="hidden sm:inline" aria-hidden="true">/</span>
          <span className="font-semibold text-black dark:text-white truncate">
            {currentItem.label}
          </span>
          {contextSuffix && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-[#FF6A00] font-medium truncate">{contextSuffix}</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2 & 3: Theme Switcher + Primary Journey Shortcut */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-black" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {activeSection !== 'partner-portal' && (
          <button
            type="button"
            onClick={() => onNavigate('partner-portal')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:border-[#FF6A00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Partner Portal</span>
          </button>
        )}

        {activeSection !== 'country-discovery' && (
          <button
            type="button"
            onClick={() => onNavigate('country-discovery')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Country Discovery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
