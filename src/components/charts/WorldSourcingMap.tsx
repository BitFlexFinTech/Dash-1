import React, { useState } from 'react';
import { CountryProfile } from '../../types/bws';
import { ArrowRight } from 'lucide-react';

// UK target destination coordinates on 1000x500 world canvas
const UK_HUB = { x: 482, y: 146 };

export const WorldSourcingMap: React.FC<{
  countries: CountryProfile[];
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  compact?: boolean;
}> = ({ countries, selectedCountryId, onSelectCountry, compact = false }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeCountry =
    countries.find((c) => c.id === (hoveredId || selectedCountryId)) || countries[0];

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
      <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Global Drinks Sourcing & UK Corridor Map
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select any producing market marker to inspect category strengths, producers, and UK representation gaps.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#FF6A00] inline-block" />
            <span>Primary Focus / Selected</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-zinc-900 dark:bg-white inline-block" />
            <span>Active Market</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-[#FF6A00] inline-block" />
            <span>UK Destination Hub</span>
          </span>
        </div>
      </div>

      <div className="relative bg-zinc-50 dark:bg-[#070708] overflow-hidden">
        <svg
          viewBox="0 0 1000 480"
          className={`w-full ${compact ? 'max-h-[310px]' : 'max-h-[430px]'} h-auto block select-none`}
          role="img"
          aria-label="Interactive global sourcing map showing international beverage markets connected to the UK"
        >
          {/* Subtle latitude / longitude architectural grid */}
          <g className="stroke-zinc-200/80 dark:stroke-zinc-800/60" strokeWidth="0.6">
            {[96, 192, 288, 384].map((y) => (
              <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} />
            ))}
            {[125, 250, 375, 500, 625, 750, 875].map((x) => (
              <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="480" />
            ))}
          </g>

          {/* Stylized clean geometric continent silhouettes */}
          <g className="fill-zinc-200/85 dark:fill-zinc-800/85 stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="0.8">
            {/* North & Central America */}
            <path d="M 75,85 L 250,65 L 305,110 L 295,155 L 265,180 L 245,220 L 218,248 L 222,272 L 190,266 L 165,232 L 130,200 L 105,155 L 70,125 Z" />
            {/* Caribbean Islands */}
            <path d="M 252,254 L 278,252 L 290,264 L 284,274 L 258,272 Z" />
            {/* South America */}
            <path d="M 248,284 L 315,294 L 352,338 L 332,395 L 296,445 L 272,442 L 265,382 L 244,330 Z" />
            {/* UK & Ireland */}
            <path d="M 468,128 L 486,122 L 492,152 L 474,158 Z" />
            <path d="M 458,140 L 468,138 L 469,154 L 457,154 Z" />
            {/* Continental Europe */}
            <path d="M 465,180 L 492,162 L 515,152 L 548,135 L 575,92 L 605,98 L 598,155 L 575,185 L 545,196 L 525,204 L 512,188 L 492,195 L 465,204 Z" />
            {/* Africa */}
            <path d="M 462,216 L 548,214 L 592,248 L 614,292 L 585,355 L 555,392 L 526,386 L 512,330 L 490,295 L 456,272 L 448,240 Z" />
            {/* Eurasia / Middle East / Asia */}
            <path d="M 598,105 L 760,82 L 892,108 L 882,160 L 835,178 L 800,224 L 745,248 L 712,282 L 682,256 L 642,246 L 606,232 L 585,195 Z" />
            {/* Japan */}
            <path d="M 836,184 L 854,174 L 858,198 L 840,218 L 828,214 Z" />
            {/* SE Asia & Australia */}
            <path d="M 744,274 L 792,282 L 808,308 L 758,310 Z" />
            <path d="M 762,338 L 848,332 L 872,374 L 846,416 L 780,410 L 754,376 Z" />
          </g>

          {/* Sourcing Corridor Curves to UK */}
          {countries.map((country) => {
            const isSelected = country.id === selectedCountryId;
            const isHovered = country.id === hoveredId;
            const active = isSelected || isHovered;
            const midX = (country.coordinates.x + UK_HUB.x) / 2;
            const midY = Math.min(country.coordinates.y, UK_HUB.y) - 38;
            return (
              <path
                key={`arc-${country.id}`}
                d={`M ${country.coordinates.x} ${country.coordinates.y} Q ${midX} ${midY} ${UK_HUB.x} ${UK_HUB.y}`}
                fill="none"
                stroke={active ? '#FF6A00' : 'currentColor'}
                className={
                  active
                    ? 'opacity-90 transition-opacity duration-150'
                    : 'text-zinc-400/35 dark:text-zinc-600/45 transition-opacity duration-150'
                }
                strokeWidth={active ? 1.8 : 0.9}
                strokeDasharray={active ? undefined : '3 3'}
              />
            );
          })}

          {/* UK Destination Hub Marker */}
          <g transform={`translate(${UK_HUB.x}, ${UK_HUB.y})`}>
            <rect
              x="-6"
              y="-6"
              width="12"
              height="12"
              className="fill-white dark:fill-black stroke-[#FF6A00]"
              strokeWidth="2"
            />
            <text
              x="11"
              y="3"
              className="fill-black dark:fill-white text-[10px] font-mono font-semibold"
            >
              UK HUB
            </text>
          </g>

          {/* Country Markers */}
          {countries.map((country) => {
            const isSelected = country.id === selectedCountryId;
            const isHovered = country.id === hoveredId;
            const isPrimary = country.commercialOpportunityIndicator === 'Primary Focus';
            const SPARSE_LABELS = ['za', 'us', 'mx', 'ar', 'jp', 'au_nz', 'sct', 'sg_cn_kr', 'cb'];
            const showLabel = isSelected || isHovered || SPARSE_LABELS.includes(country.id);

            return (
              <g
                key={country.id}
                transform={`translate(${country.coordinates.x}, ${country.coordinates.y})`}
                className="cursor-pointer"
                onClick={() => onSelectCountry(country.id)}
                onMouseEnter={() => setHoveredId(country.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {isSelected && (
                  <rect
                    x="-11"
                    y="-11"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="#FF6A00"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                )}
                <rect
                  x={isSelected || isHovered ? -6 : -4}
                  y={isSelected || isHovered ? -6 : -4}
                  width={isSelected || isHovered ? 12 : 8}
                  height={isSelected || isHovered ? 12 : 8}
                  className={
                    isSelected || isPrimary
                      ? 'fill-[#FF6A00] stroke-white dark:stroke-black'
                      : 'fill-zinc-900 dark:fill-white stroke-white dark:stroke-black'
                  }
                  strokeWidth="1.5"
                />
                {showLabel && (
                  <text
                    x="10"
                    y="3"
                    className={`text-[10px] font-medium transition-colors ${
                      isSelected || isHovered
                        ? 'fill-[#FF6A00] font-bold'
                        : 'fill-zinc-700 dark:fill-zinc-300'
                    }`}
                  >
                    {country.name} ({country.brandsDiscoveredCount})
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Bottom Contextual Inspector Bar inside Map Frame */}
        {activeCountry && (
          <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
              <span className="font-semibold text-black dark:text-white">
                {activeCountry.name}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                Categories: <strong className="text-zinc-800 dark:text-zinc-200 font-medium">{activeCountry.categories.join(', ')}</strong>
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                Brands Discovered: <strong className="text-black dark:text-white">{activeCountry.brandsDiscoveredCount}</strong>
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                UK Presence: <strong className="text-zinc-800 dark:text-zinc-200 font-medium">{activeCountry.ukPresenceIndicator}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectCountry(activeCountry.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6A00] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Inspect Country Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
