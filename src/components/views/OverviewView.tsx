import React from 'react';
import { ArrowRight, Globe2 } from 'lucide-react';
import {
  AMAZON_UK_LISTINGS,
  BRANDS,
  COUNTRIES,
  EVIDENCE_RECORDS,
  ONBOARDING_RECORDS,
  PORTFOLIO_BRANDS,
  PRODUCTS,
} from '../../data/bwsData';
import { BrandProfile, CountryProfile, DrinkCategory, NavSectionId, ProductSku } from '../../types/bws';
import { ALL_DRINK_CATEGORIES } from '../ui/MultiSelectCategoryFilter';
import {
  MetricStrip,
  OpportunityStatusText,
  PrototypeBannerNote,
  SectionHeader,
  VerificationLabel,
} from '../ui/SharedPrimitives';
import { WorldSourcingMap } from '../charts/WorldSourcingMap';
import { HorizontalBarChart } from '../charts/AnalyticsCharts';

export const OverviewView: React.FC<{
  selectedCountryId: string;
  brands?: BrandProfile[];
  countries?: CountryProfile[];
  skus?: ProductSku[];
  onSelectCountryAndOpen: (countryId: string) => void;
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
  onOpenCategoryInBrandDiscovery?: (category: DrinkCategory) => void;
  onNavigate: (section: NavSectionId) => void;
}> = ({
  selectedCountryId,
  brands = BRANDS,
  countries = COUNTRIES,
  skus = PRODUCTS,
  onSelectCountryAndOpen,
  onSelectBrandAndOpen,
  onOpenCategoryInBrandDiscovery,
  onNavigate,
}) => {
  const totalDiscoveredBrands = countries.reduce((acc, c) => acc + c.brandsDiscoveredCount, 0);
  const underInvestigation = brands.filter(
    (b) => b.researchStatus === 'In Review' || b.researchStatus === 'Initial Profile'
  ).length;
  const potentialOpportunities = brands.filter(
    (b) => b.opportunityStatus === 'High Potential' || b.opportunityStatus === 'Worth Investigating'
  ).length;
  const soldByAmazonCount = brands.filter((b) =>
    b.amazonUkPresence.startsWith('Sold by Amazon')
  ).length;
  const pitchTargetsCount = brands.filter((b) =>
    b.amazonUkPresence.includes("No 'Sold by Amazon'")
  ).length;
  const unclearUkArrangements = brands.filter(
    (b) =>
      b.ukArrangementType === 'Unknown' ||
      b.ukArrangementType === 'Unverified / Grey Channel' ||
      b.opportunityStatus === 'Distribution Status Unclear'
  ).length;
  const shortlistedCount = brands.filter(
    (b) =>
      b.pipelineStage === 'Shortlisted' ||
      b.pipelineStage === 'Contact Preparation' ||
      b.pipelineStage === 'In Discussion' ||
      b.pipelineStage === 'Partnership Confirmed'
  ).length;
  const onboardingCount = ONBOARDING_RECORDS.length;
  const portfolioProductCount = skus.length;
  const pipelineValueGbp = brands.reduce((acc, b) => acc + b.illustrativePipelineValueGbp, 0);

  const journeySteps: { label: string; section: NavSectionId; count: string }[] = [
    { label: 'Country Discovery', section: 'country-discovery', count: `${countries.length} markets` },
    { label: 'Brand Discovery', section: 'brand-discovery', count: `${brands.length} profiled` },
    { label: 'Brand Intelligence', section: 'brand-intelligence', count: `${brands.length} dossiers` },
    { label: 'UK Distribution', section: 'uk-distribution', count: 'Role audit' },
    { label: 'Amazon 1P Research', section: 'amazon-uk', count: `${AMAZON_UK_LISTINGS.length} ASIN checks` },
    { label: '1P Pitch Targets', section: 'pitch-targets', count: `${pitchTargetsCount} no "Sold by Amazon"` },
    { label: 'Opportunity Score', section: 'opportunity-assessment', count: `${potentialOpportunities} candidates` },
    { label: 'Acquisition Pipeline', section: 'acquisition-pipeline', count: 'Outreach + 11 stages' },
  ];

  const categoryCounts = [
    { label: 'Wine & Sparkling Wine', value: 112, valueLabel: '112 brands', highlight: true },
    { label: 'Whisky & Whiskey', value: 78, valueLabel: '78 brands', highlight: true },
    { label: 'Gin, Vodka & Rum', value: 79, valueLabel: '79 brands' },
    { label: 'Agave Spirits (Tequila & Mezcal)', value: 31, valueLabel: '31 brands' },
    { label: 'Sake & Liqueurs / Aperitifs', value: 29, valueLabel: '29 brands' },
    { label: 'Craft & Heritage Beer', value: 26, valueLabel: '26 brands' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Executive Intelligence Overview · Amazon Vendor Central UK (1P)"
        title="International Drinks Discovery & UK Market Readiness"
        description="Unified B2B intelligence across global sourcing territories, real distiller & UK distributor directories, Vendor Central UK (1P) wholesale readiness, WePrep/wet-bond operations, and live campaign tooling."
        actions={
          <>
            <button
              type="button"
              onClick={() => onNavigate('country-discovery')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Explore Country Discovery</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pitch-targets')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-[#FF6A00] text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>1P Pitch Targets ({pitchTargetsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('acquisition-pipeline')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View Acquisition Pipeline</span>
            </button>
          </>
        }
      />

      <PrototypeBannerNote text="MERCENTA BWS operates strictly via UK wholesale importing and Amazon Vendor Central UK (1P — Zero FBA). Real international producers and commercial distributors are featured below." />

      <MetricStrip
        items={[
          {
            label: 'Countries Researched',
            value: String(countries.length),
            detail: 'Global sourcing corridors active',
            highlight: true,
          },
          {
            label: 'Brands Profiled / Mapped',
            value: `${brands.length} / ${totalDiscoveredBrands}`,
            detail: `${brands.length} real-world intelligence dossiers`,
          },
          {
            label: 'Under Investigation',
            value: String(underInvestigation),
            detail: 'Active ownership & UK channel review',
          },
          {
            label: 'Potential UK 1P Opportunities',
            value: String(potentialOpportunities),
            detail: 'High Potential or Worth Investigating',
            highlight: true,
          },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
        {[
          {
            label: '"Sold by Amazon" 1P Active',
            value: String(soldByAmazonCount),
            note: `${pitchTargetsCount} brands lack "Sold by Amazon"`,
          },
          { label: 'Unclear UK Distribution', value: String(unclearUkArrangements), note: 'Requires direct confirmation' },
          { label: 'Shortlisted / In Discussion', value: String(shortlistedCount), note: 'Active outreach & terms' },
          { label: 'Brands Onboarding', value: String(onboardingCount), note: 'Vendor Central 1P prep' },
          { label: 'Products in Catalogue', value: String(portfolioProductCount), note: `${PORTFOLIO_BRANDS.length} partner brands` },
          {
            label: 'Commercial Pipeline (Est.)',
            value: `£${(pipelineValueGbp / 1000000).toFixed(2)}M`,
            note: 'Illustrative annual wholesale',
          },
        ].map((stat) => (
          <div key={stat.label} className="p-4">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono tabular-nums text-black dark:text-white">
              {stat.value}
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              {stat.note}
            </div>
          </div>
        ))}
      </div>

      {/* Connected Discovery-to-Wholesale Journey Bar */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            Connected Commercial Intelligence Workflow
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Click any stage to jump directly into that workspace
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {journeySteps.map((step, idx) => (
            <button
              key={step.section}
              type="button"
              onClick={() => onNavigate(step.section)}
              className="group p-3 border border-zinc-200 dark:border-zinc-800 hover:border-[#FF6A00] dark:hover:border-[#FF6A00] bg-zinc-50 dark:bg-zinc-950 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                <span>0{idx + 1}</span>
                <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-[#FF6A00] transition-colors" />
              </div>
              <div className="mt-1.5 text-xs font-semibold text-black dark:text-white group-hover:text-[#FF6A00] transition-colors">
                {step.label}
              </div>
              <div className="mt-0.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                {step.count}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive 10-Category Drink Coverage Grid */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-black dark:text-white">
              10-Category BWS Coverage (Click to Filter Brand Discovery)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Explore real producers across Wine, Sparkling Wine, Beer, Vodka, Rum, Whisky & Whiskey, Gin, Agave, Liqueurs & Sake.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('brand-discovery')}
            className="text-xs font-semibold text-[#FF6A00] hover:underline cursor-pointer"
          >
            Distillers & Contacts Directory →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {ALL_DRINK_CATEGORIES.map((category) => {
            const count = brands.filter(
              (b) => b.primaryCategory === category || b.categories.includes(category)
            ).length;
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  onOpenCategoryInBrandDiscovery
                    ? onOpenCategoryInBrandDiscovery(category)
                    : onNavigate('brand-discovery')
                }
                className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-[#FF6A00] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-black dark:text-white truncate">
                  {category}
                </div>
                <div className="text-[11px] font-mono text-[#FF6A00] mt-1">
                  {count} profiled {count === 1 ? 'brand' : 'brands'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive World Map + Category Footprint */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <WorldSourcingMap
            countries={countries}
            selectedCountryId={selectedCountryId}
            onSelectCountry={onSelectCountryAndOpen}
            compact
          />
        </div>
        <div>
          <HorizontalBarChart
            title="Discovered Brands by Drinks Category"
            subtitle="Illustrative international sourcing footprint"
            items={categoryCounts}
          />
        </div>
      </div>

      {/* Priority Commercial Candidates & Evidence Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-black dark:text-white">
                Priority Brands Under Commercial Review
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select any brand to inspect ownership, UK distribution, and Vendor Central UK 1P findings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('brand-discovery')}
              className="text-xs font-semibold text-[#FF6A00] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              All Brands →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                  <th className="py-2.5 px-4">Brand</th>
                  <th className="py-2.5 px-4">Origin</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Amazon UK (1P / 3P)</th>
                  <th className="py-2.5 px-4">Opportunity</th>
                  <th className="py-2.5 px-4 text-right">Est. Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {brands.slice(0, 8).map((brand) => (
                  <tr
                    key={brand.id}
                    onClick={() => onSelectBrandAndOpen(brand.id, 'brand-intelligence')}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-black dark:text-white whitespace-nowrap">
                      {brand.name}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {brand.countryName}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {brand.primaryCategory}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {brand.amazonUkPresence}
                    </td>
                    <td className="py-3 px-4">
                      <OpportunityStatusText status={brand.opportunityStatus} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-black dark:text-white whitespace-nowrap">
                      £{brand.illustrativePipelineValueGbp.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-black dark:text-white">
              Recent Source Verification Audits
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Latest evidence checks across UK trade & Amazon 1P marketplaces.
            </p>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 flex-1">
            {EVIDENCE_RECORDS.slice(0, 5).map((ev) => (
              <div key={ev.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-black dark:text-white truncate">
                    {ev.sourceName}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                    {ev.dateReviewed}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {ev.supports}
                </p>
                <div className="pt-0.5">
                  <VerificationLabel status={ev.verificationStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
