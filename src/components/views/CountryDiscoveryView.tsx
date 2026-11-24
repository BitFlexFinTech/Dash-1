import React, { useMemo, useState } from 'react';
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react';
import { BRANDS, COUNTRIES, EVIDENCE_RECORDS, PRODUCTS } from '../../data/bwsData';
import { BrandProfile, CountryProfile, DrinkCategory, NavSectionId, ProductSku } from '../../types/bws';
import { MultiSelectCategoryFilter } from '../ui/MultiSelectCategoryFilter';
import {
  EvidenceLedger,
  OpportunityStatusText,
  PrototypeBannerNote,
  SectionHeader,
  VerificationLabel,
} from '../ui/SharedPrimitives';
import { WorldSourcingMap } from '../charts/WorldSourcingMap';

export const CountryDiscoveryView: React.FC<{
  selectedCountryId: string;
  brands?: BrandProfile[];
  countries?: CountryProfile[];
  skus?: ProductSku[];
  onSelectCountry: (countryId: string) => void;
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
  onOpenCountryInBrandDiscovery: (countryId: string) => void;
}> = ({
  selectedCountryId,
  brands = BRANDS,
  countries = COUNTRIES,
  skus = PRODUCTS,
  onSelectCountry,
  onSelectBrandAndOpen,
  onOpenCountryInBrandDiscovery,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<DrinkCategory[]>([]);
  const [ukPresenceFilter, setUkPresenceFilter] = useState<string>('All');
  const [researchFilter, setResearchFilter] = useState<string>('All');

  const filteredCountries = useMemo(() => {
    return countries.filter((country) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        country.name.toLowerCase().includes(q) ||
        country.specialities.some((s) => s.toLowerCase().includes(q)) ||
        country.categories.some((c) => c.toLowerCase().includes(q));
      const matchesCat =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => country.categories.includes(cat));
      const matchesUk =
        ukPresenceFilter === 'All' || country.ukPresenceIndicator === ukPresenceFilter;
      const matchesResearch =
        researchFilter === 'All' || country.researchStatus === researchFilter;
      return matchesCat && matchesQuery && matchesUk && matchesResearch;
    });
  }, [countries, searchQuery, selectedCategories, ukPresenceFilter, researchFilter]);

  const activeCountry =
    countries.find((c) => c.id === selectedCountryId) || filteredCountries[0] || countries[0];

  const countryBrands = brands.filter((b) => b.countryId === activeCountry.id);
  const countryProducts = skus.filter((p) => p.countryId === activeCountry.id);
  const countryEvidence = EVIDENCE_RECORDS.filter(
    (ev) =>
      ev.entityId === activeCountry.id ||
      countryBrands.some((b) => b.id === ev.entityId)
  );

  const ukSellingBrands = countryBrands.filter(
    (b) =>
      b.ukPresenceStatus === 'Present (Verified Distributor)' ||
      b.ukPresenceStatus === 'Present (Multiple Sellers)'
  );
  const unclearUkBrands = countryBrands.filter(
    (b) =>
      b.ukArrangementType === 'Unknown' ||
      b.ukArrangementType === 'None Confirmed' ||
      b.ukArrangementType === 'Unverified / Grey Channel'
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Core Discovery Engine"
        title="Country Discovery & Producer Territories"
        description="Explore international beer, wine, and spirits markets country by country—moving from regional industry strengths to verified distillers, brand portfolios, UK distribution status, and Amazon Vendor Central UK (1P) opportunities."
        actions={
          <button
            type="button"
            onClick={() => onOpenCountryInBrandDiscovery(activeCountry.id)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Filter {activeCountry.name} in Brand Discovery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      />

      <PrototypeBannerNote
        text={`Mercenta's geographic sourcing footprint across ${countries.length} producing countries and regions in Africa, Europe, the Americas & Asia-Pacific (including Castle Lager & Amarula in South Africa, Heineken in the Netherlands, Guinness in Ireland, Asahi & Suntory in Japan, Patrón in Mexico & craft independents).`}
      />

      <WorldSourcingMap
        countries={countries}
        selectedCountryId={activeCountry.id}
        onSelectCountry={onSelectCountry}
      />

      {/* Search & Multi-Select Category Filter Bar */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or speciality (e.g. Speyside, Vodka, Mezcal)..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          <MultiSelectCategoryFilter
            selected={selectedCategories}
            onChange={setSelectedCategories}
            label="Drink Categories"
          />

          <select
            value={ukPresenceFilter}
            onChange={(e) => setUkPresenceFilter(e.target.value)}
            aria-label="Filter by UK market presence"
            className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
          >
            <option value="All">All UK Presence Levels</option>
            <option value="Under-Represented">Under-Represented</option>
            <option value="Emerging / Fragmented">Emerging / Fragmented</option>
            <option value="Selective Presence">Selective Presence</option>
            <option value="High Saturation">High Saturation</option>
          </select>

          <select
            value={researchFilter}
            onChange={(e) => setResearchFilter(e.target.value)}
            aria-label="Filter by research status"
            className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
          >
            <option value="All">All Research Statuses</option>
            <option value="Active Deep Dive">Active Deep Dive</option>
            <option value="Structured Review">Structured Review</option>
            <option value="Initial Mapping">Initial Mapping</option>
          </select>
        </div>
      </div>

      {/* Country Directory + Selected Country Profile Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-black dark:text-white">
              Country Directory ({filteredCountries.length})
            </h2>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Select territory
            </span>
          </div>
          {filteredCountries.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No countries match your active filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategories([]);
                  setUkPresenceFilter('All');
                  setResearchFilter('All');
                }}
                className="text-xs font-semibold text-[#FF6A00] hover:underline cursor-pointer"
              >
                Reset Directory Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[760px] overflow-y-auto">
              {filteredCountries.map((country) => {
                const isSelected = country.id === activeCountry.id;
                return (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => onSelectCountry(country.id)}
                    className={`w-full p-4 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-black'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-[#FF6A00]' : 'text-zinc-400'
                          }`}
                        />
                        <span className="text-sm font-semibold">{country.name}</span>
                      </div>
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          isSelected ? 'text-[#FF6A00] font-semibold' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {country.brandsDiscoveredCount} brands
                      </span>
                    </div>

                    <div
                      className={`mt-1.5 text-xs ${
                        isSelected ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {country.categories.join(' · ')}
                    </div>

                    <div
                      className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${
                        isSelected ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      <span>{country.researchStatus}</span>
                      <span aria-hidden="true">·</span>
                      <span>UK: {country.ukPresenceIndicator}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          country.commercialOpportunityIndicator === 'Primary Focus'
                            ? 'text-[#FF6A00] font-medium'
                            : ''
                        }
                      >
                        {country.commercialOpportunityIndicator}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  <span className="font-mono text-[#FF6A00]">{activeCountry.isoCode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeCountry.regionGroup}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeCountry.researchStatus}</span>
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  {activeCountry.name}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Commercial Priority
                </div>
                <div className="text-sm font-semibold text-[#FF6A00]">
                  {activeCountry.commercialOpportunityIndicator}
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {activeCountry.overview}
            </p>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Discovery Journey Path
              </div>
              <div className="flex flex-wrap items-center gap-2 text-black dark:text-white font-medium">
                <span className="text-[#FF6A00] font-semibold">{activeCountry.name}</span>
                <span aria-hidden="true">→</span>
                <span>{activeCountry.categories[0]} Producers</span>
                <span aria-hidden="true">→</span>
                <span>Discovered Brands ({countryBrands.length} profiled)</span>
                <span aria-hidden="true">→</span>
                <span>Product Range ({countryProducts.length} SKUs)</span>
                <span aria-hidden="true">→</span>
                <span>Amazon Vendor Central UK (1P)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div>
                <h3 className="text-xs font-semibold text-black dark:text-white mb-1.5">
                  Drinks Industry & Category Strengths
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {activeCountry.industryStrengths}
                </p>
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Specialities: <span className="text-black dark:text-white font-medium">{activeCountry.specialities.join(' · ')}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-black dark:text-white mb-1.5">
                  UK Market & Export Presence
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {activeCountry.ukMarketSummary}
                </p>
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Key Export Markets: <span className="text-black dark:text-white font-medium">{activeCountry.exportMarkets.join(' · ')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 border border-zinc-200 dark:border-zinc-800 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800">
              <div className="p-3.5">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Brands Mapped</div>
                <div className="text-lg font-bold font-mono tabular-nums text-black dark:text-white mt-0.5">
                  {activeCountry.brandsDiscoveredCount}
                </div>
              </div>
              <div className="p-3.5">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Already in UK</div>
                <div className="text-lg font-bold font-mono tabular-nums text-black dark:text-white mt-0.5">
                  {ukSellingBrands.length} profiled
                </div>
              </div>
              <div className="p-3.5">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Unclear UK Rep.</div>
                <div className="text-lg font-bold font-mono tabular-nums text-[#FF6A00] mt-0.5">
                  {activeCountry.unclearRepresentationCount}
                </div>
              </div>
              <div className="p-3.5">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Acquisition Watch</div>
                <div className="text-lg font-bold font-mono tabular-nums text-black dark:text-white mt-0.5">
                  {activeCountry.acquisitionCandidatesCount}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-black dark:text-white">
                Featured Producers & Distillers in {activeCountry.name}
              </h3>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {activeCountry.featuredProducers.length} featured
              </span>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {activeCountry.featuredProducers.map((producer) => (
                <div key={producer.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#FF6A00] shrink-0" />
                      <span className="text-sm font-semibold text-black dark:text-white">
                        {producer.name}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {producer.region} · {producer.speciality}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      Est. {producer.established} · Capacity: {producer.annualCapacity}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <VerificationLabel status={producer.verificationStatus} />
                    {producer.brandIds[0] && (
                      <button
                        type="button"
                        onClick={() => onSelectBrandAndOpen(producer.brandIds[0], 'brand-intelligence')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6A00] hover:underline cursor-pointer"
                      >
                        <span>Inspect Producer Brand</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Profiled Brands from {activeCountry.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Distinguishing brands with UK representation from open 1P Vendor Central targets ({unclearUkBrands.length} in sample).
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                    <th className="py-2.5 px-4">Brand</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">UK Presence</th>
                    <th className="py-2.5 px-4">UK Arrangement</th>
                    <th className="py-2.5 px-4">Opportunity Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {countryBrands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                      <td className="py-3 px-4 font-semibold text-black dark:text-white whitespace-nowrap">
                        {brand.name}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {brand.primaryCategory}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {brand.ukPresenceStatus}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {brand.ukArrangementType}
                      </td>
                      <td className="py-3 px-4">
                        <OpportunityStatusText status={brand.opportunityStatus} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectBrandAndOpen(brand.id, 'brand-intelligence')}
                          className="text-xs font-semibold text-[#FF6A00] hover:underline whitespace-nowrap cursor-pointer"
                        >
                          Open Intelligence →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {countryProducts.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5">
              <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
                Notable Products Tracked in {activeCountry.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {countryProducts.map((sku) => (
                  <div
                    key={sku.id}
                    className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-black dark:text-white truncate">
                        {sku.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {sku.brandName} · {sku.productType} · {sku.bottleSize} · {sku.abv} ABV
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectBrandAndOpen(sku.brandId, 'brand-intelligence')}
                      className="text-[11px] font-semibold text-[#FF6A00] hover:underline shrink-0 cursor-pointer"
                    >
                      Brand
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <EvidenceLedger
            records={countryEvidence}
            title={`Reviewed Sources & Evidence — ${activeCountry.name}`}
          />
        </div>
      </div>
    </div>
  );
};
