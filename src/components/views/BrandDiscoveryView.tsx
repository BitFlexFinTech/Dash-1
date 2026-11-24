import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  ExternalLink,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  BRANDS,
  COUNTRIES,
  DISTILLER_DIRECTORY,
} from '../../data/bwsData';
import {
  BrandProfile,
  CountryProfile,
  DistillerManufacturerRecord,
  DrinkCategory,
  NavSectionId,
  OpportunityStatus,
  ProductSku,
} from '../../types/bws';
import { AiMarketScoutModal } from '../ui/AiMarketScoutModal';
import { ALL_DRINK_CATEGORIES, MultiSelectCategoryFilter } from '../ui/MultiSelectCategoryFilter';
import {
  OpportunityStatusText,
  PrototypeBannerNote,
  SectionHeader,
  VerificationLabel,
} from '../ui/SharedPrimitives';

interface DiscoveryLookupResult {
  engineUsed?: string;
  brandName: string;
  countryName: string;
  region: string;
  brandOwner: string;
  parentCompany: string;
  manufacturer: string;
  productionLocation: string;
  website: string;
  description: string;
  primaryCategory: string;
  productRangeSummary: string;
  ukPresenceStatus: string;
  ukImporterOrDistributor: string;
  ukArrangementType: string;
  amazonUkPresence: string;
  opportunityStatus: string;
  nextAction: string;
  exportContactRole: string;
  exportContactEmail: string;
  ukDistributorWebsite: string;
  ukDistributorContact: string;
  ukRepresentationStatus: string;
  flagshipSkuName: string;
  flagshipSkuType: string;
  flagshipBottleSize: string;
  flagshipAbv: string;
  flagshipPackFormat: string;
  flagshipTastingNotes: string;
  flagshipWholesaleGbp: number;
  flagshipRrpGbp: number;
  flagshipImageUrl?: string;
}

function normalizeDrinkCategory(raw: string): DrinkCategory {
  const exact = ALL_DRINK_CATEGORIES.find((c) => c.toLowerCase() === raw.trim().toLowerCase());
  if (exact) return exact;
  const lower = raw.toLowerCase();
  if (lower.includes('sparkling') || lower.includes('champagne') || lower.includes('prosecco')) {
    return 'Sparkling Wine';
  }
  if (lower.includes('wine')) return 'Wine';
  if (lower.includes('beer') || lower.includes('lager') || lower.includes('ale') || lower.includes('cider')) {
    return 'Beer';
  }
  if (lower.includes('vodka')) return 'Vodka';
  if (lower.includes('rum')) return 'Rum';
  if (lower.includes('whisky') || lower.includes('whiskey') || lower.includes('bourbon')) {
    return 'Whisky & Whiskey';
  }
  if (lower.includes('gin')) return 'Gin';
  if (lower.includes('tequila') || lower.includes('mezcal') || lower.includes('agave')) {
    return 'Agave Spirits';
  }
  if (lower.includes('liqueur') || lower.includes('aperitif') || lower.includes('cream')) {
    return 'Liqueurs & Aperitifs';
  }
  return 'Sake & Specialty';
}

function normalizeUkPresence(raw: string): BrandProfile['ukPresenceStatus'] {
  if (raw.includes('Verified')) return 'Present (Verified Distributor)';
  if (raw.includes('Multiple')) return 'Present (Multiple Sellers)';
  if (raw.includes('Not Observed')) return 'Not Observed in UK';
  return 'Limited / Sporadic';
}

function normalizeUkArrangement(raw: string): BrandProfile['ukArrangementType'] {
  if (raw.includes('Exclusive') && !raw.includes('Non-Exclusive')) return 'Exclusive (Verified)';
  if (raw.includes('Non-Exclusive')) return 'Non-Exclusive (Verified)';
  if (raw.includes('Grey') || raw.includes('Unverified')) return 'Unverified / Grey Channel';
  if (raw.includes('None')) return 'None Confirmed';
  return 'Unknown';
}

function normalizeAmazonPresence(raw: string): BrandProfile['amazonUkPresence'] {
  if (raw.includes('1P Vendor Central Active') || (raw.includes('Sold by Amazon') && !raw.includes('3P') && !raw.includes('No'))) {
    return 'Sold by Amazon (1P Vendor Central Active)';
  }
  if (raw.includes('Sold by Amazon + 3P') || raw.includes('Brand Store')) {
    return 'Sold by Amazon + 3P Resellers';
  }
  if (raw.includes('3P Resellers Only') || raw.includes('1P Target')) {
    return "Sold by 3P Resellers Only (No 'Sold by Amazon' — 1P Target)";
  }
  return "3P Fragmented / Unclaimed (No 'Sold by Amazon')";
}

function normalizeOpportunity(raw: string): OpportunityStatus {
  const valid: OpportunityStatus[] = [
    'High Potential',
    'Worth Investigating',
    'Existing UK Representation',
    'Distribution Status Unclear',
    'Requires Further Research',
    'Not Suitable',
  ];
  const found = valid.find((v) => v.toLowerCase() === raw.trim().toLowerCase());
  if (found) return found;
  if (raw.toLowerCase().includes('high')) return 'High Potential';
  if (raw.toLowerCase().includes('existing')) return 'Existing UK Representation';
  return 'Worth Investigating';
}

function normalizeRepStatus(raw: string): DistillerManufacturerRecord['ukRepresentationStatus'] {
  if (raw.includes('Subsidiary')) return 'Brand Subsidiary UK';
  if (raw.includes('Verified')) return 'Verified UK Agency';
  if (raw.includes('Open') || raw.includes('1P')) return 'Open / 1P Amazon Opportunity';
  return 'Multiple / Non-Exclusive';
}

export const BrandDiscoveryView: React.FC<{
  brands?: BrandProfile[];
  distillers?: DistillerManufacturerRecord[];
  countries?: CountryProfile[];
  initialCountryFilter?: string;
  initialCategoriesFilter?: DrinkCategory[];
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
  onAddDiscoveredBrand?: (payload: {
    brand: BrandProfile;
    distiller: DistillerManufacturerRecord;
    sku: ProductSku;
  }) => void;
}> = ({
  brands = BRANDS,
  distillers = DISTILLER_DIRECTORY,
  countries = COUNTRIES,
  initialCountryFilter = 'All',
  initialCategoriesFilter = [],
  onSelectBrandAndOpen,
  onAddDiscoveredBrand,
}) => {
  const [activeTab, setActiveTab] = useState<'brands' | 'distillers'>('brands');
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState(initialCountryFilter);
  const [selectedCategories, setSelectedCategories] =
    useState<DrinkCategory[]>(initialCategoriesFilter);
  const [ukPresenceFilter, setUkPresenceFilter] = useState('All');
  const [opportunityFilter, setOpportunityFilter] = useState('All');

  // AI Brand Lookup & Unbiased Market Scout Modal state
  const [scoutOpen, setScoutOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupCountryHint, setLookupCountryHint] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<DiscoveryLookupResult | null>(null);
  const [addedBrandId, setAddedBrandId] = useState<string | null>(null);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return brands.filter((b) => {
      const matchesQ =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.brandOwner.toLowerCase().includes(q) ||
        b.manufacturer.toLowerCase().includes(q) ||
        b.productRangeSummary.toLowerCase().includes(q) ||
        b.countryName.toLowerCase().includes(q);
      const matchesCountry = countryFilter === 'All' || b.countryId === countryFilter;
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some(
          (cat) => b.primaryCategory === cat || b.categories.includes(cat)
        );
      const matchesUk = ukPresenceFilter === 'All' || b.ukPresenceStatus === ukPresenceFilter;
      const matchesOpp = opportunityFilter === 'All' || b.opportunityStatus === opportunityFilter;
      return matchesQ && matchesCountry && matchesCategory && matchesUk && matchesOpp;
    });
  }, [brands, searchQuery, countryFilter, selectedCategories, ukPresenceFilter, opportunityFilter]);

  const filteredDistillers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return distillers.filter((d) => {
      const matchesQ =
        !q ||
        d.distillerName.toLowerCase().includes(q) ||
        d.brandName.toLowerCase().includes(q) ||
        d.ukDistributorName.toLowerCase().includes(q) ||
        d.drinksProduced.toLowerCase().includes(q) ||
        d.countryName.toLowerCase().includes(q);
      const matchesCountry = countryFilter === 'All' || d.countryId === countryFilter;
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => d.categories.includes(cat));
      return matchesQ && matchesCountry && matchesCategory;
    });
  }, [distillers, searchQuery, countryFilter, selectedCategories]);

  const resetFilters = () => {
    setSearchQuery('');
    setCountryFilter('All');
    setSelectedCategories([]);
    setUkPresenceFilter('All');
    setOpportunityFilter('All');
  };

  const openAiLookupWithSeed = (seedQuery?: string) => {
    setLookupOpen(true);
    if (seedQuery !== undefined) setLookupQuery(seedQuery);
    setLookupError(null);
    setAddedBrandId(null);
  };

  const handleRunAiLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    setAddedBrandId(null);

    try {
      const res = await fetch('/api/discovery/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: lookupQuery.trim(),
          countryHint: lookupCountryHint.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to look up brand and distributor.');
      }
      setLookupResult(data as DiscoveryLookupResult);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'AI lookup request failed.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCommitDiscoveredBrand = () => {
    if (!lookupResult || !onAddDiscoveredBrand) return;

    const slug = lookupResult.brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const brandId = brands.some((b) => b.id === slug) ? `${slug}-${Date.now()}` : slug;
    const category = normalizeDrinkCategory(lookupResult.primaryCategory || '');
    const matchedCountry = countries.find(
      (c) => c.name.toLowerCase() === (lookupResult.countryName || '').toLowerCase()
    );
    const countryId = matchedCountry?.id || 'global';
    const countryName = matchedCountry?.name || lookupResult.countryName || 'International';
    const cleanWebsite = (lookupResult.website || '')
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '') || `${slug}.com`;

    const skuId = `sku-${brandId}`;
    const newBrand: BrandProfile = {
      id: brandId,
      name: lookupResult.brandName,
      countryId,
      countryName,
      region: lookupResult.region || countryName,
      brandOwner: lookupResult.brandOwner || lookupResult.manufacturer,
      parentCompany: lookupResult.parentCompany || 'Independent / Private',
      manufacturer: lookupResult.manufacturer || lookupResult.brandOwner,
      productionLocation: lookupResult.productionLocation || `${lookupResult.region}, ${countryName}`,
      licensingArrangement: `${lookupResult.brandOwner} producer rights · UK 1P assessment`,
      ownershipVerification: 'Partially Verified',
      website: cleanWebsite,
      description: lookupResult.description,
      categories: [category],
      primaryCategory: category,
      productRangeSummary: lookupResult.productRangeSummary || lookupResult.flagshipSkuName,
      internationalMarkets: [countryName, 'United Kingdom', 'European Union'],
      internationalDistributors: [
        {
          market: 'United Kingdom',
          organisation: lookupResult.ukImporterOrDistributor,
          role: 'UK Importer / Distributor',
          status: 'Partially Verified',
        },
      ],
      retailAndMarketplacePresence: `${lookupResult.amazonUkPresence} · UK distributor: ${lookupResult.ukImporterOrDistributor}`,
      ukPresenceStatus: normalizeUkPresence(lookupResult.ukPresenceStatus || ''),
      ukImporterOrDistributor: lookupResult.ukImporterOrDistributor,
      ukArrangementType: normalizeUkArrangement(lookupResult.ukArrangementType || ''),
      amazonUkPresence: normalizeAmazonPresence(lookupResult.amazonUkPresence || ''),
      researchStatus: 'Initial Profile',
      opportunityStatus: normalizeOpportunity(lookupResult.opportunityStatus || ''),
      pipelineStage: 'Discovered',
      nextAction: lookupResult.nextAction,
      illustrativePipelineValueGbp: 185000,
      skuIds: [skuId],
    };

    const newDistiller: DistillerManufacturerRecord = {
      id: `dist-ai-${Date.now()}`,
      distillerName: lookupResult.manufacturer || lookupResult.brandOwner,
      brandId,
      brandName: lookupResult.brandName,
      countryId,
      countryName,
      region: lookupResult.region || countryName,
      categories: [category],
      drinksProduced: lookupResult.productRangeSummary || lookupResult.flagshipSkuName,
      exportWebsite: `https://${cleanWebsite}`,
      exportContactEmail: lookupResult.exportContactEmail || `exports@${cleanWebsite}`,
      exportContactRole: lookupResult.exportContactRole || 'International Export Team',
      ukDistributorName: lookupResult.ukImporterOrDistributor || 'Open UK 1P Evaluation',
      ukDistributorWebsite: lookupResult.ukDistributorWebsite || `https://${cleanWebsite}`,
      ukDistributorContact: lookupResult.ukDistributorContact || `uktrade@${cleanWebsite}`,
      ukRepresentationStatus: normalizeRepStatus(lookupResult.ukRepresentationStatus || ''),
    };

    const newSku: ProductSku = {
      id: skuId,
      brandId,
      brandName: lookupResult.brandName,
      countryId,
      countryName,
      name: lookupResult.flagshipSkuName || `${lookupResult.brandName} Flagship`,
      category,
      productType: lookupResult.flagshipSkuType || category,
      bottleSize: lookupResult.flagshipBottleSize || '700ml',
      abv: lookupResult.flagshipAbv || '40.0%',
      packFormat: lookupResult.flagshipPackFormat || '6 × 700ml Case',
      packagingInfo: `${lookupResult.productionLocation || countryName} · AI-discovered UK 1P spec`,
      tastingNotes: lookupResult.flagshipTastingNotes || lookupResult.description,
      imageUrl: lookupResult.flagshipImageUrl || '',
      status: 'Evaluating',
      illustrativeWholesaleGbp: Number(lookupResult.flagshipWholesaleGbp) || 18.5,
      illustrativeRrpGbp: Number(lookupResult.flagshipRrpGbp) || 29.5,
    };

    onAddDiscoveredBrand({ brand: newBrand, distiller: newDistiller, sku: newSku });
    setAddedBrandId(brandId);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Global Brand & Producer Discovery"
        title="International Brands & Global Distillers Directory"
        description="Screen real international alcohol producers, examine brand ownership vs. UK distributor contact details, and use AI Discovery to research & add any new global brewery, winery, or distiller into your workspace."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('brands')}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  activeTab === 'brands'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-500'
                }`}
              >
                Brands ({brands.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('distillers')}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  activeTab === 'distillers'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-500'
                }`}
              >
                Distillers, Brewers & UK Distributors ({distillers.length})
              </button>
            </div>
            <button
              type="button"
              onClick={() => setScoutOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>AI Market Scout (Unbiased)</span>
            </button>
            <button
              type="button"
              onClick={() => openAiLookupWithSeed(searchQuery)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Lookup Specific Brand</span>
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        }
      />

      <PrototypeBannerNote
        text={`Pre-loaded with ${brands.length} global producers across ${countries.length} countries and 10 drink categories with 1:1 UK distributor records. Use AI Market Scout to discover net-new brands objectively by region, category, and 1P gap.`}
      />

      {/* Multi-Facet Filter Bar */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-start">
          <div className="relative xl:col-span-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand, producer, country, category..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            aria-label="Filter by country of origin"
            className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
          >
            <option value="All">All Countries ({countries.length})</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <MultiSelectCategoryFilter
            selected={selectedCategories}
            onChange={setSelectedCategories}
            label="Drink Categories"
          />

          <select
            value={ukPresenceFilter}
            onChange={(e) => setUkPresenceFilter(e.target.value)}
            aria-label="Filter by UK presence"
            disabled={activeTab === 'distillers'}
            className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white disabled:opacity-45 focus:outline-none focus:border-[#FF6A00]"
          >
            <option value="All">All UK Presence States</option>
            <option value="Not Observed in UK">Not Observed in UK</option>
            <option value="Limited / Sporadic">Limited / Sporadic</option>
            <option value="Present (Multiple Sellers)">Present (Multiple Sellers)</option>
            <option value="Present (Verified Distributor)">Present (Verified Distributor)</option>
          </select>

          <select
            value={opportunityFilter}
            onChange={(e) => setOpportunityFilter(e.target.value)}
            aria-label="Filter by acquisition or opportunity status"
            disabled={activeTab === 'distillers'}
            className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white disabled:opacity-45 focus:outline-none focus:border-[#FF6A00]"
          >
            <option value="All">All Opportunity Statuses</option>
            <option value="High Potential">High Potential</option>
            <option value="Worth Investigating">Worth Investigating</option>
            <option value="Existing UK Representation">Existing UK Representation</option>
            <option value="Distribution Status Unclear">Distribution Status Unclear</option>
            <option value="Requires Further Research">Requires Further Research</option>
            <option value="Not Suitable">Not Suitable</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-mono tabular-nums">
            {activeTab === 'brands'
              ? `Showing ${filteredBrands.length} of ${brands.length} profiled international brands`
              : `Showing ${filteredDistillers.length} of ${distillers.length} global distiller, brewer & UK distributor records`}
          </span>
          <span>
            {activeTab === 'brands'
              ? 'Click any row to open full Brand Intelligence dossier'
              : 'Click any brand link or email to open Outreach Tracker & Pitch Drawer'}
          </span>
        </div>
      </div>

      {activeTab === 'brands' ? (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
          {filteredBrands.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-medium text-black dark:text-white">
                No pre-loaded brands match &ldquo;{searchQuery || 'your current filter'}&rdquo;.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openAiLookupWithSeed(searchQuery)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    AI Lookup {searchQuery.trim() ? `“${searchQuery.trim()}”` : 'New Brand'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  Show All {brands.length} Brands
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                    <th className="py-3 px-4">Brand & Owner</th>
                    <th className="py-3 px-4">Origin</th>
                    <th className="py-3 px-4">Producer / Manufacturer</th>
                    <th className="py-3 px-4">Category & Range</th>
                    <th className="py-3 px-4">UK Presence & Importer</th>
                    <th className="py-3 px-4">Amazon UK (1P / 3P)</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Opportunity</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {filteredBrands.map((brand) => (
                    <tr
                      key={brand.id}
                      onClick={() => onSelectBrandAndOpen(brand.id, 'brand-intelligence')}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/45 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 min-w-[190px]">
                        <div className="font-semibold text-black dark:text-white">{brand.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Owner: {brand.brandOwner}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-black dark:text-white font-medium">{brand.countryName}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{brand.region}</div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 min-w-[170px]">
                        {brand.manufacturer}
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="font-medium text-black dark:text-white">{brand.primaryCategory}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {brand.productRangeSummary}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="font-medium text-black dark:text-white">{brand.ukPresenceStatus}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {brand.ukImporterOrDistributor}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {brand.amazonUkPresence}
                      </td>
                      <td className="py-3.5 px-4">
                        <VerificationLabel status={brand.ownershipVerification} />
                      </td>
                      <td className="py-3.5 px-4">
                        <OpportunityStatusText status={brand.opportunityStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[#FF6A00] font-semibold">
                          <span>Dossier</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
          {filteredDistillers.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-medium text-black dark:text-white">
                No pre-loaded producers match &ldquo;{searchQuery || 'your current filter'}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => openAiLookupWithSeed(searchQuery)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Lookup Producer & UK Distributor</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                  <th className="py-3 px-4">Distiller / Brewer / Producer</th>
                  <th className="py-3 px-4">Origin & Drinks Produced</th>
                  <th className="py-3 px-4">Producer Export Contact</th>
                  <th className="py-3 px-4">UK Distributor / Agency</th>
                  <th className="py-3 px-4">UK Representation Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {filteredDistillers.map((dist) => (
                  <tr key={dist.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="py-3.5 px-4 min-w-[210px]">
                      <div className="flex items-center gap-1.5 font-semibold text-black dark:text-white">
                        <Building2 className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                        <span>{dist.distillerName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectBrandAndOpen(dist.brandId, 'brand-intelligence')}
                        className="text-[11px] font-semibold text-[#FF6A00] hover:underline mt-0.5 cursor-pointer"
                      >
                        Brand: {dist.brandName}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <div className="font-medium text-black dark:text-white">
                        {dist.countryName} · {dist.region}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {dist.drinksProduced}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[200px] space-y-1">
                      <div className="font-medium text-black dark:text-white">{dist.exportContactRole}</div>
                      <div className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                        <Mail className="w-3 h-3 text-[#FF6A00]" />
                        <span>{dist.exportContactEmail}</span>
                      </div>
                      <div>
                        <a
                          href={dist.exportWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#FF6A00] hover:underline"
                        >
                          <span>Producer Site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[220px] space-y-1">
                      <div className="font-semibold text-black dark:text-white">{dist.ukDistributorName}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{dist.ukDistributorContact}</div>
                      <a
                        href={dist.ukDistributorWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#FF6A00] hover:underline"
                      >
                        <span>UK Distributor Site</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-black dark:text-white">
                      {dist.ukRepresentationStatus}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectBrandAndOpen(dist.brandId, 'acquisition-pipeline')}
                        className="text-xs font-semibold text-[#FF6A00] hover:underline cursor-pointer"
                      >
                        Track Outreach →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* LIVE AI BRAND & DISTRIBUTOR LOOKUP MODAL */}
      {lookupOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0B0B0D] border border-zinc-300 dark:border-zinc-700 p-6 space-y-5 text-xs">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="font-mono text-[11px] font-semibold text-[#FF6A00]">
                  BUILT-IN AI STUDIO GEMINI · LIVE DIRECTORY EXPANSION
                </div>
                <h2 className="text-lg font-bold text-black dark:text-white mt-0.5">
                  AI Discover Brand, Producer & UK Distributor
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Enter any international beer, wine, or spirits brand (e.g. Savanna Dry, Buffalo Trace, Moët Ice, Cruzcampo, Kavalan Whisky) to research its real manufacturer, UK distributor & flagship SKU.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLookupOpen(false)}
                aria-label="Close AI brand lookup"
                className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRunAiLookup} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block text-[11px] text-zinc-500 mb-1">Brand or Producer Name *</label>
                <input
                  type="text"
                  required
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. Savanna Dry, Kavalan, Brooklyn Brewery..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] text-zinc-500 mb-1">Country Hint (Optional)</label>
                <input
                  type="text"
                  value={lookupCountryHint}
                  onChange={(e) => setLookupCountryHint(e.target.value)}
                  placeholder="e.g. South Africa"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                />
              </div>
              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full py-2 px-3 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lookupLoading ? 'Researching...' : 'Lookup Brand'}</span>
                </button>
              </div>
            </form>

            {lookupLoading && (
              <div className="p-5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2 animate-pulse">
                <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
              </div>
            )}

            {lookupError && (
              <div className="p-3 border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
                {lookupError}
              </div>
            )}

            {lookupResult && (
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono text-[#FF6A00]">
                      {lookupResult.engineUsed || 'AI Studio Gemini'} · {lookupResult.primaryCategory}
                    </div>
                    <h3 className="text-base font-bold text-black dark:text-white mt-0.5">
                      {lookupResult.brandName} ({lookupResult.countryName})
                    </h3>
                    <div className="text-zinc-500 dark:text-zinc-400">
                      {lookupResult.region} · {lookupResult.website}
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-black dark:text-white border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 bg-white dark:bg-black">
                    {lookupResult.opportunityStatus}
                  </span>
                </div>

                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {lookupResult.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="text-[11px] text-zinc-500">Producer / Manufacturer</div>
                    <div className="font-semibold text-black dark:text-white">{lookupResult.manufacturer}</div>
                    <div className="text-[11px] text-zinc-500">
                      Owner: {lookupResult.brandOwner} ({lookupResult.parentCompany})
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">UK Importer / Distributor</div>
                    <div className="font-semibold text-black dark:text-white">
                      {lookupResult.ukImporterOrDistributor}
                    </div>
                    <div className="text-[11px] font-mono text-[#FF6A00]">
                      {lookupResult.exportContactEmail}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[11px] font-mono text-[#FF6A00]">FLAGSHIP UK SKU SPEC</div>
                  <div className="font-semibold text-black dark:text-white">
                    {lookupResult.flagshipSkuName} · {lookupResult.flagshipBottleSize} · {lookupResult.flagshipAbv} ABV
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {lookupResult.flagshipPackFormat} · Est. 1P Cost £{Number(lookupResult.flagshipWholesaleGbp || 18).toFixed(2)} · Target RRP £{Number(lookupResult.flagshipRrpGbp || 29).toFixed(2)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {addedBrandId ? (
                    <div className="flex items-center gap-3 w-full justify-between">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Added to Brands, Distillers Directory & Product Catalogue!</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLookupOpen(false);
                          onSelectBrandAndOpen(addedBrandId, 'brand-intelligence');
                        }}
                        className="px-4 py-2 bg-[#FF6A00] text-white font-semibold cursor-pointer"
                      >
                        Open Brand Dossier →
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[11px] text-zinc-500">
                        Saves to Brands, Distillers & UK Distributors, and Product Catalogue.
                      </span>
                      <button
                        type="button"
                        onClick={handleCommitDiscoveredBrand}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Directory</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {scoutOpen && (
        <AiMarketScoutModal
          brands={brands}
          countries={countries}
          onAddDiscoveredBrand={onAddDiscoveredBrand}
          onSelectBrandAndOpen={onSelectBrandAndOpen}
          onClose={() => setScoutOpen(false)}
        />
      )}
    </div>
  );
};
