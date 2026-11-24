import React from 'react';

export const HorizontalBarChart: React.FC<{
  title: string;
  subtitle?: string;
  items: { label: string; value: number; valueLabel: string; highlight?: boolean }[];
}> = ({ title, subtitle, items }) => {
  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-black dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const pct = Math.round((item.value / maxVal) * 100);
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-3">
                <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate">
                  {item.label}
                </span>
                <span className="font-mono tabular-nums text-zinc-600 dark:text-zinc-400 shrink-0">
                  {item.valueLabel}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    item.highlight ? 'bg-[#FF6A00]' : 'bg-zinc-900 dark:bg-zinc-300'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DualRevenueChart: React.FC<{
  title: string;
  subtitle?: string;
  data: { month: string; wholesaleGbp: number; amazonUkGbp: number }[];
}> = ({ title, subtitle, data }) => {
  const maxVal = Math.max(...data.flatMap((d) => [d.wholesaleGbp, d.amazonUkGbp]), 1);
  const chartHeight = 170;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-black dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-zinc-900 dark:bg-white inline-block" />
            <span>UK Wholesale</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#FF6A00] inline-block" />
            <span>Amazon UK Channel</span>
          </span>
        </div>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-6 gap-3 items-end" style={{ height: `${chartHeight}px` }}>
          {data.map((d) => {
            const wHeight = Math.max(Math.round((d.wholesaleGbp / maxVal) * (chartHeight - 28)), 6);
            const aHeight = Math.max(Math.round((d.amazonUkGbp / maxVal) * (chartHeight - 28)), 6);
            return (
              <div key={d.month} className="flex flex-col items-center justify-end h-full gap-1.5 group">
                <div className="flex items-end gap-1.5 w-full justify-center">
                  <div
                    className="w-5 sm:w-6 bg-zinc-900 dark:bg-zinc-200 transition-opacity group-hover:opacity-85"
                    style={{ height: `${wHeight}px` }}
                    title={`${d.month} UK Wholesale: £${d.wholesaleGbp.toLocaleString()}`}
                  />
                  <div
                    className="w-5 sm:w-6 bg-[#FF6A00] transition-opacity group-hover:opacity-85"
                    style={{ height: `${aHeight}px` }}
                    title={`${d.month} Amazon UK: £${d.amazonUkGbp.toLocaleString()}`}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  {d.month}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-6 gap-3 text-center">
          {data.map((d) => (
            <div key={`tot-${d.month}`} className="text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
              £{Math.round((d.wholesaleGbp + d.amazonUkGbp) / 1000)}k
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
