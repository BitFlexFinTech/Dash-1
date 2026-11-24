import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, LayoutGrid, List, X } from 'lucide-react';
import {
  AMAZON_UK_LISTINGS,
  BRANDS,
  ONBOARDING_RECORDS,
  PORTFOLIO_BRANDS,
  PRODUCTS,
} from '../../data/bwsData';
import { DrinkCategory, NavSectionId, ProductSku } from '../../types/bws';
import { SkuPriceHistoryChart } from '../charts/BenchmarkAndPriceCharts';
import { MultiSelectCategoryFilter } from '../ui/MultiSelectCategoryFilter';
import {
  MetricStrip,
  ProductVisual,
  PrototypeBannerNote,
  SectionHeader,
} from '../ui/SharedPrimitives';

/* ============================================================================
 * 13. BRAND PORTFOLIO
 * ========================================================================== */
export const BrandPortfolioView: React.FC<{
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
}> = ({ onSelectBrandAndOpen }) => {
  const totalRev = PORTFOLIO_BRANDS.reduce((a, b) => a + b.illustrativeAnnualRevenueGbp, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Partner Portfolio Management"
        title="Brand Portfolio"
        description="Partner producers integrated into Mercenta's UK wholesale, WePrep 1P prep, and Amazon Vendor Central UK (1P) retail stewardship."
      />

      <PrototypeBannerNote text="Portfolio revenue and YoY growth figures reflect Vendor Central UK (1P) wholesale and UK trade channels (Zero FBA)." />

      <MetricStrip
        items={[
          {
            label: 'Active & Launching Partners',
            value: String(PORTFOLIO_BRANDS.length),
            detail: 'Post-discovery partner brands',
            highlight: true,
          },
          {
            label: 'Active Portfolio SKUs',
            value: String(PORTFOLIO_BRANDS.reduce((a, b) => a + b.skuCount, 0)),
            detail: 'Wine, Spirits & Sake',
          },
          {
            label: 'Illustrative Annual Run-Rate',
            value: `£${totalRev.toLocaleString()}`,
            detail: 'Combined UK Wholesale + Vendor Central 1P',
            highlight: true,
          },
          {
            label: 'Amazon Vendor Central 1P',
            value: '3 Active / 1 Prep',
            detail: 'Authorised UK 1P partner representation',
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PORTFOLIO_BRANDS.map((pf) => (
          <div
            key={pf.id}
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono text-[#FF6A00]">{pf.portfolioStatus}</div>
                  <h2 className="text-lg font-bold text-black dark:text-white mt-0.5">
                    {pf.brandName}
                  </h2>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {pf.countryName} · {pf.brandOwner}
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-700 dark:text-zinc-300">
                Categories:{' '}
                <span className="font-medium text-black dark:text-white">
                  {pf.categories.join(', ')}
                </span>{' '}
                · <span className="font-mono">{pf.skuCount} SKUs</span>
              </div>

              <div className="grid grid-cols-2 border border-zinc-200 dark:border-zinc-800 divide-x divide-zinc-200 dark:divide-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <div className="p-3">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Est. Annual Sales
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-black dark:text-white mt-0.5">
                    £{pf.illustrativeAnnualRevenueGbp.toLocaleString()}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    YoY Trend (Sample)
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-[#FF6A00] mt-0.5">
                    {pf.illustrativeYoyGrowthPct > 0
                      ? `+${pf.illustrativeYoyGrowthPct}%`
                      : 'Launching'}
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <div>
                  <span className="font-semibold text-black dark:text-white">
                    Amazon UK 1P Presence:{' '}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{pf.amazonUkStatus}</span>
                </div>
                <div>
                  <span className="font-semibold text-black dark:text-white">
                    Growth Opportunity:{' '}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{pf.growthOpportunity}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onSelectBrandAndOpen(pf.brandId, 'brand-intelligence')}
                className="font-semibold text-black dark:text-white hover:text-[#FF6A00] cursor-pointer"
              >
                Brand Intelligence
              </button>
              <button
                type="button"
                onClick={() => onSelectBrandAndOpen(pf.brandId, 'brand-growth')}
                className="inline-flex items-center gap-1 font-semibold text-[#FF6A00] hover:underline cursor-pointer"
              >
                <span>Growth View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * 14. PRODUCT CATALOGUE (REACTIVE TO PARTNER PORTAL + MULTI-SELECT CATEGORIES)
 * ========================================================================== */
export const ProductCatalogueView: React.FC<{
  skus?: ProductSku[];
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
}> = ({ skus = PRODUCTS, onSelectBrandAndOpen }) => {
  const [selectedCategories, setSelectedCategories] = useState<DrinkCategory[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);

  const filteredProducts = useMemo(
    () =>
      skus.filter(
        (p) => selectedCategories.length === 0 || selectedCategories.includes(p.category)
      ),
    [skus, selectedCategories]
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Beverage SKU Directory"
        title="Product Catalogue"
        description="Structured Beer, Wine & Spirits SKU catalogue synced live with Partner Portal bottle uploads, ABV% declarations, tasting notes, and Vendor Central UK (1P) RRP targets."
        actions={
          <div className="flex flex-wrap items-start gap-2.5">
            <div className="w-56">
              <MultiSelectCategoryFilter
                selected={selectedCategories}
                onChange={setSelectedCategories}
                label="Categories"
              />
            </div>
            <div className="flex border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        }
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((sku) => (
            <div
              key={sku.id}
              onClick={() => setSelectedSku(sku)}
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] hover:border-[#FF6A00] transition-colors flex flex-col cursor-pointer"
            >
              <ProductVisual
                src={sku.imageUrl}
                alt={sku.name}
                className="w-full h-48 object-contain bg-white dark:bg-zinc-950 p-2 border-b border-zinc-200 dark:border-zinc-800"
              />
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {sku.brandName} · {sku.countryName}
                  </div>
                  <h3 className="text-sm font-semibold text-black dark:text-white mt-0.5 line-clamp-2">
                    {sku.name}
                  </h3>
                  <div className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {sku.productType} · {sku.bottleSize} ·{' '}
                    <span className="font-mono">{sku.abv}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-black dark:text-white">
                    RRP £{sku.illustrativeRrpGbp.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-medium text-[#FF6A00]">{sku.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Origin</th>
                <th className="py-3 px-4">Category & Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">ABV</th>
                <th className="py-3 px-4">Pack Format</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Target RRP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {filteredProducts.map((sku) => (
                <tr
                  key={sku.id}
                  onClick={() => setSelectedSku(sku)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer"
                >
                  <td className="py-3 px-4 font-semibold text-black dark:text-white whitespace-nowrap">
                    {sku.name}
                  </td>
                  <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {sku.brandName}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {sku.countryName}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                    {sku.category} · {sku.productType}
                  </td>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">{sku.bottleSize}</td>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">{sku.abv}</td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {sku.packFormat}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#FF6A00] whitespace-nowrap">
                    {sku.status}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-black dark:text-white">
                    £{sku.illustrativeRrpGbp.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SKU Detail Modal */}
      {selectedSku && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="text-xs font-mono text-[#FF6A00]">
                {selectedSku.brandName} · {selectedSku.countryName}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSku(null)}
                className="p-1 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="Close product specification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <ProductVisual
                  src={selectedSku.imageUrl}
                  alt={selectedSku.name}
                  className="w-full h-64 object-contain bg-white dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800"
                />
                <div className="space-y-4 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-black dark:text-white">
                      {selectedSku.name}
                    </h3>
                    <div className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {selectedSku.category} · {selectedSku.productType}
                    </div>
                  </div>
                  <dl className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Measure & ABV</dt>
                      <dd className="font-mono font-medium text-black dark:text-white">
                        {selectedSku.bottleSize} · {selectedSku.abv}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Pack Format</dt>
                      <dd className="text-black dark:text-white">{selectedSku.packFormat}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">1P Wholesale Est.</dt>
                      <dd className="font-mono text-black dark:text-white">
                        £{selectedSku.illustrativeWholesaleGbp.toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Target UK RRP</dt>
                      <dd className="font-mono font-semibold text-[#FF6A00]">
                        £{selectedSku.illustrativeRrpGbp.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                  <div className="text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div>
                      <strong className="text-black dark:text-white">Packaging:</strong>{' '}
                      {selectedSku.packagingInfo}
                    </div>
                    {selectedSku.tastingNotes && (
                      <div>
                        <strong className="text-black dark:text-white">Tasting Notes:</strong>{' '}
                        {selectedSku.tastingNotes}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const bId = selectedSku.brandId;
                      setSelectedSku(null);
                      onSelectBrandAndOpen(bId, 'brand-intelligence');
                    }}
                    className="w-full py-2.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold text-xs cursor-pointer"
                  >
                    Open Brand Intelligence Dossier
                  </button>
                </div>
              </div>

              <SkuPriceHistoryChart
                sku={selectedSku}
                brand={BRANDS.find((b) => b.id === selectedSku.brandId)}
                amazonListing={AMAZON_UK_LISTINGS.find((a) => a.brandId === selectedSku.brandId)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 15. BRAND ONBOARDING
 * ========================================================================== */
export const BrandOnboardingView: React.FC<{
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
}> = ({ onSelectBrandAndOpen }) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Partner Activation Workflow"
        title="Brand Onboarding — Vendor Central UK (1P)"
        description="Operational milestone checklist guiding confirmed international partners through AWRS checks, UK strip labelling, 3P wet-bond / WePrep intake, and Amazon Vendor Central UK (1P) launch."
      />

      <PrototypeBannerNote text="Onboarding progress milestones align with Mercenta's Vendor Central UK (1P) & WePrep / Wet-Bond SOP." />

      <div className="space-y-6">
        {ONBOARDING_RECORDS.map((record) => (
          <div
            key={record.id}
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {record.countryName} · {record.category} · Target: {record.targetLaunchWindow}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectBrandAndOpen(record.brandId, 'brand-intelligence')}
                  className="text-lg font-bold text-black dark:text-white hover:text-[#FF6A00] mt-0.5 cursor-pointer"
                >
                  {record.brandName}
                </button>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono tabular-nums text-[#FF6A00]">
                  {record.overallProgressPct}%
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Onboarding Completion
                </div>
              </div>
            </div>

            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className="h-full bg-[#FF6A00]"
                style={{ width: `${record.overallProgressPct}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {record.stages.map((st, idx) => (
                <div
                  key={st.stageName}
                  className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-black dark:text-white">
                      {String(idx + 1).padStart(2, '0')}. {st.stageName}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Owner: {st.owner} · {st.updatedDate}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium shrink-0 ${
                      st.status === 'Completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : st.status === 'In Progress'
                        ? 'text-[#FF6A00]'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {st.status === 'Completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{st.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
