import React from 'react';
import {
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  ClipboardCheck,
  Compass,
  FileCheck2,
  GitBranch,
  Globe2,
  LayoutDashboard,
  Megaphone,
  Package,
  PoundSterling,
  Search,
  Settings,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Target,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { NavSectionId } from '../../types/bws';

export interface NavItemConfig {
  id: NavSectionId;
  label: string;
  group: 'Core Intelligence' | 'Commercial & Portfolio' | 'Operations & Compliance' | 'Growth & Platform';
  icon: React.FC<{ className?: string }>;
  prominent?: boolean;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: 'Overview', group: 'Core Intelligence', icon: LayoutDashboard },
  { id: 'country-discovery', label: 'Country Discovery', group: 'Core Intelligence', icon: Globe2, prominent: true },
  { id: 'brand-discovery', label: 'Brand Discovery', group: 'Core Intelligence', icon: Search },
  { id: 'brand-intelligence', label: 'Brand Intelligence', group: 'Core Intelligence', icon: Building2 },
  { id: 'uk-distribution', label: 'UK Distribution Research', group: 'Core Intelligence', icon: Compass },
  { id: 'amazon-uk', label: 'Amazon UK Research', group: 'Core Intelligence', icon: ShoppingBag },
  { id: 'pitch-targets', label: '1P Pitch Targets', group: 'Core Intelligence', icon: Target, prominent: true },
  { id: 'opportunity-assessment', label: 'Opportunity Assessment', group: 'Core Intelligence', icon: ClipboardCheck },
  { id: 'acquisition-pipeline', label: 'Acquisition Pipeline', group: 'Commercial & Portfolio', icon: GitBranch },
  { id: 'brand-portfolio', label: 'Brand Portfolio', group: 'Commercial & Portfolio', icon: BookOpen },
  { id: 'product-catalogue', label: 'Product Catalogue', group: 'Commercial & Portfolio', icon: Package },
  { id: 'brand-onboarding', label: 'Brand Onboarding', group: 'Commercial & Portfolio', icon: FileCheck2 },
  { id: 'partner-portal', label: 'Partner Portal', group: 'Commercial & Portfolio', icon: Users, prominent: true },
  { id: 'compliance-regulatory', label: 'Compliance & Regulatory', group: 'Operations & Compliance', icon: ShieldCheck },
  { id: 'import-excise', label: 'Import & Excise', group: 'Operations & Compliance', icon: Ship },
  { id: 'wholesale-distribution', label: 'Wholesale Distribution', group: 'Operations & Compliance', icon: Truck },
  { id: 'inventory-fulfilment', label: 'Inventory & Fulfilment', group: 'Operations & Compliance', icon: Boxes },
  { id: 'campaign-studio', label: 'Campaign Studio', group: 'Growth & Platform', icon: Megaphone },
  { id: 'brand-growth', label: 'Brand Growth', group: 'Growth & Platform', icon: TrendingUp },
  { id: 'financials', label: 'Financials', group: 'Growth & Platform', icon: PoundSterling },
  { id: 'reports-analytics', label: 'Reports & Analytics', group: 'Growth & Platform', icon: BarChart3 },
  { id: 'settings', label: 'Admin & Settings', group: 'Growth & Platform', icon: Settings },
];

const GROUPS: NavItemConfig['group'][] = [
  'Core Intelligence',
  'Commercial & Portfolio',
  'Operations & Compliance',
  'Growth & Platform',
];

export const Sidebar: React.FC<{
  activeSection: NavSectionId;
  onSelectSection: (id: NavSectionId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}> = ({ activeSection, onSelectSection, mobileOpen, onCloseMobile }) => {
  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#050506] border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
      {/* Mercenta Brand Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => {
            onSelectSection('overview');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left cursor-pointer"
        >
          <span className="w-6 h-6 bg-[#FF6A00] flex items-center justify-center text-white font-display font-extrabold text-xs tracking-tighter">
            M
          </span>
          <span className="font-display font-bold text-sm tracking-tight text-black dark:text-white whitespace-nowrap">
            MERCENTA <span className="text-[#FF6A00]">BWS</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Primary Sidebar Navigation">
        {GROUPS.map((groupName) => {
          const items = NAV_ITEMS.filter((item) => item.group === groupName);
          return (
            <div key={groupName}>
              <div className="px-2.5 mb-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {groupName}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSection(item.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-[13px] transition-colors text-left cursor-pointer ${
                          isActive
                            ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                            : item.prominent
                            ? 'text-black dark:text-white font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/70'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? 'text-[#FF6A00]'
                                : item.prominent
                                ? 'text-[#FF6A00]'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.prominent && !isActive && (
                          <span className="w-1.5 h-1.5 bg-[#FF6A00] shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Quiet Workspace Context Footer */}
      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
        <div className="font-medium text-zinc-800 dark:text-zinc-200">
          Amazon Vendor Central UK (1P)
        </div>
        <div className="mt-0.5">UK BWS Wholesale & WePrep Ops</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 h-screen sticky top-0">
        {renderNavContent()}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-[270px] max-w-[85vw] h-full z-10">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};
