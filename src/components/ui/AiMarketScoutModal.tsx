import React, { useState } from 'react';
import { CheckCircle2, Compass, Plus, Sparkles, X } from 'lucide-react';
import {
  BrandProfile,
  CountryProfile,
  DistillerManufacturerRecord,
  DrinkCategory,
  NavSectionId,
  ProductSku,
  ScoutCandidate,
} from '../../types/bws';
import { ALL_DRINK_CATEGORIES } from './MultiSelectCategoryFilter';

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
  if (
    raw.includes('1P Vendor Central Active') ||
    (raw.includes('Sold by Amazon') && !raw.includes('3P') && !raw.includes('No'))
  ) {
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

function normalizeOpportunity(raw: string): BrandProfile['opportunityStatus'] {
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

const OBJECTIVE_CRITERIA = [
  "No 'Sold by Amazon' 1P Buy Box (3P Reseller Leakage)",
  'Strong 1P Margin Headroom & Gift-Pack Potential',
  'Proven Export Producer Under-Represented on Amazon UK',
  'Fragmented UK Importer / Open E-Commerce Stewardship',
];

export const AiMarketScoutModal: React.FC<{
  brands: BrandProfile[];
  countries: CountryProfile[];
  onAddDiscoveredBrand?: (payload: {
    brand: BrandProfile;
    distiller: DistillerManufacturerRecord;
    sku: ProductSku;
  }) => void;
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
  onClose: () => void;
}> = ({ brands, countries, onAddDiscoveredBrand, onSelectBrandAndOpen, onClose }) => {
  const [regionOrCountry, setRegionOrCountry] = useState<string>('Any Global Market');
  const [category, setCategory] = useState<string>('Any Drink Category');
  const [objectiveCriterion, setObjectiveCriterion] = useState<string>(OBJECTIVE_CRITERIA[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>('');
  const [candidates, setCandidates] = useState<ScoutCandidate[]>([]);
  const [addedBrandIds, setAddedBrandIds] = useState<Record<string, string>>({});

  const handleRunScout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCandidates([]);
    setAddedBrandIds({});

    try {
      const res = await fetch('/api/discovery/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionOrCountry,
          category,
          objectiveCriterion,
          excludeBrandNames: brands.map((b) => b.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run unbiased AI Market Scout.');
      }
      setEngineUsed(String(data.engineUsed || 'AI Studio Gemini'));
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Market Scout request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitCandidate = (cand: ScoutCandidate, idx: number) => {
    if (!onAddDiscoveredBrand) return;
    const slug = cand.brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const brandId = brands.some((b) => b.id === slug) ? `${slug}-${Date.now()}-${idx}` : slug;
    const cat = normalizeDrinkCategory(cand.primaryCategory || '');
    const matchedCountry = countries.find(
      (c) => c.name.toLowerCase() === (cand.countryName || '').toLowerCase()
    );
    const countryId = matchedCountry?.id || 'global';
    const countryName = matchedCountry?.name || cand.countryName || 'International';
    const cleanWebsite =
      (cand.website || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || `${slug}.com`;
    const skuId = `sku-${brandId}`;

    const newBrand: BrandProfile = {
      id: brandId,
      name: cand.brandName,
      countryId,
      countryName,
      region: cand.region || countryName,
      brandOwner: cand.brandOwner || cand.manufacturer,
      parentCompany: cand.parentCompany || 'Independent / Private',
      manufacturer: cand.manufacturer || cand.brandOwner,
      productionLocation: cand.productionLocation || `${cand.region}, ${countryName}`,
      licensingArrangement: `${cand.brandOwner} producer rights · UK 1P Mutual Fit assessment`,
      ownershipVerification: 'Partially Verified',
      website: cleanWebsite,
      description: cand.description,
      categories: [cat],
      primaryCategory: cat,
      productRangeSummary: cand.productRangeSummary || cand.flagshipSkuName,
      internationalMarkets: [countryName, 'United Kingdom', 'European Union'],
      internationalDistributors: [
        {
          market: 'United Kingdom',
          organisation: cand.ukImporterOrDistributor,
          role: 'UK Importer / Distributor',
          status: 'Partially Verified',
        },
      ],
      retailAndMarketplacePresence: `${cand.amazonUkPresence} · UK route: ${cand.ukImporterOrDistributor}`,
      ukPresenceStatus: normalizeUkPresence(cand.ukPresenceStatus || ''),
      ukImporterOrDistributor: cand.ukImporterOrDistributor,
      ukArrangementType: normalizeUkArrangement(cand.ukArrangementType || ''),
      amazonUkPresence: normalizeAmazonPresence(cand.amazonUkPresence || ''),
      researchStatus: 'Initial Profile',
      opportunityStatus: normalizeOpportunity(cand.opportunityStatus || ''),
      pipelineStage: 'Discovered',
      nextAction: cand.nextAction,
      illustrativePipelineValueGbp: 195000,
      skuIds: [skuId],
    };

    const newDistiller: DistillerManufacturerRecord = {
      id: `dist-scout-${Date.now()}-${idx}`,
      distillerName: cand.manufacturer || cand.brandOwner,
      brandId,
      brandName: cand.brandName,
      countryId,
      countryName,
      region: cand.region || countryName,
      categories: [cat],
      drinksProduced: cand.productRangeSummary || cand.flagshipSkuName,
      exportWebsite: `https://${cleanWebsite}`,
      exportContactEmail: cand.exportContactEmail || `exports@${cleanWebsite}`,
      exportContactRole: cand.exportContactRole || 'International Export Team',
      ukDistributorName: cand.ukImporterOrDistributor || 'Open UK 1P Evaluation',
      ukDistributorWebsite: cand.ukDistributorWebsite || `https://${cleanWebsite}`,
      ukDistributorContact: cand.ukDistributorContact || `uktrade@${cleanWebsite}`,
      ukRepresentationStatus: normalizeRepStatus(cand.ukRepresentationStatus || ''),
    };

    const newSku: ProductSku = {
      id: skuId,
      brandId,
      brandName: cand.brandName,
      countryId,
      countryName,
      name: cand.flagshipSkuName || `${cand.brandName} Flagship`,
      category: cat,
      productType: cand.flagshipSkuType || cat,
      bottleSize: cand.flagshipBottleSize || '700ml',
      abv: cand.flagshipAbv || '40.0%',
      packFormat: cand.flagshipPackFormat || '6 × 700ml Case',
      packagingInfo: `${cand.productionLocation || countryName} · AI Market Scout UK 1P spec`,
      tastingNotes: cand.flagshipTastingNotes || cand.description,
      imageUrl: cand.flagshipImageUrl || '',
      status: 'Evaluating',
      illustrativeWholesaleGbp: Number(cand.flagshipWholesaleGbp) || 18.0,
      illustrativeRrpGbp: Number(cand.flagshipRrpGbp) || 29.0,
    };

    onAddDiscoveredBrand({ brand: newBrand, distiller: newDistiller, sku: newSku });
    setAddedBrandIds((prev) => ({ ...prev, [cand.brandName]: brandId }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0B0B0D] border border-zinc-300 dark:border-zinc-700 p-6 space-y-5 text-xs">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="font-mono text-[11px] font-semibold text-[#FF6A00]">
              Unbiased Objective Discovery · AI Market Scout
            </div>
            <h2 className="text-lg font-bold text-black dark:text-white mt-0.5">
              Scout Untapped International Producers &amp; Mutual 1P Value
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
              Discover net-new international BWS brands objectively by market, category, and UK Amazon 1P gap—excluding the {brands.length} brands already in your workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Market Scout"
            className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleRunScout} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="block text-[11px] text-zinc-500 mb-1">Target Market / Region</label>
            <select
              value={regionOrCountry}
              onChange={(e) => setRegionOrCountry(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
            >
              <option value="Any Global Market">Any Global Market (Cross-Region)</option>
              <option value="Europe">Europe (All Wine, Beer &amp; Spirits)</option>
              <option value="Americas">Americas (US, Mexico, Caribbean, South America)</option>
              <option value="Africa">Africa (South Africa &amp; Emerging Producers)</option>
              <option value="Asia-Pacific">Asia-Pacific (Japan, Australia, New Zealand, Taiwan)</option>
              {countries.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] text-zinc-500 mb-1">Drink Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
            >
              <option value="Any Drink Category">Any Drink Category</option>
              {ALL_DRINK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] text-zinc-500 mb-1">Objective Selection Criterion</label>
            <select
              value={objectiveCriterion}
              onChange={(e) => setObjectiveCriterion(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
            >
              {OBJECTIVE_CRITERIA.map((cr) => (
                <option key={cr} value={cr}>
                  {cr}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{loading ? 'Scouting...' : 'Run Scout'}</span>
            </button>
          </div>
        </form>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((k) => (
              <div
                key={k}
                className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2 animate-pulse"
              >
                <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {candidates.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              <span>
                {candidates.length} Objective Candidates Discovered · Engine: {engineUsed}
              </span>
              <span>Sorted by Objective 1P Mutual Fit Score</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates
                .slice()
                .sort((a, b) => Number(b.objectiveScore || 0) - Number(a.objectiveScore || 0))
                .map((cand, idx) => {
                  const committedId = addedBrandIds[cand.brandName];
                  const marginGbp = Math.max(
                    0,
                    Number(cand.flagshipRrpGbp || 29) - Number(cand.flagshipWholesaleGbp || 18)
                  );
                  const marginPct =
                    Number(cand.flagshipRrpGbp || 29) > 0
                      ? Math.round((marginGbp / Number(cand.flagshipRrpGbp || 29)) * 100)
                      : 0;

                  return (
                    <div
                      key={`${cand.brandName}-${idx}`}
                      className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {cand.countryName} · {cand.primaryCategory} · {cand.manufacturer}
                            </div>
                            <h3 className="text-sm font-bold text-black dark:text-white mt-0.5">
                              {cand.brandName}
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono tabular-nums font-bold text-sm text-[#FF6A00]">
                              {cand.objectiveScore}/100
                            </div>
                            <div className="text-[10px] text-zinc-500">Objective Fit</div>
                          </div>
                        </div>

                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {cand.description}
                        </p>

                        <div className="p-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                          <div className="font-mono text-[10.5px] text-[#FF6A00] font-semibold">
                            Mutual Win-Win Analysis
                          </div>
                          <div>
                            <strong className="text-black dark:text-white">Brand Wins:</strong>{' '}
                            <span className="text-zinc-600 dark:text-zinc-300">
                              {cand.brandWinSummary}
                            </span>
                          </div>
                          <div>
                            <strong className="text-black dark:text-white">Mercenta 1P Wins:</strong>{' '}
                            <span className="text-zinc-600 dark:text-zinc-300">
                              {cand.mercentaWinSummary}
                            </span>
                          </div>
                        </div>

                        <div className="font-mono tabular-nums text-[11px] text-zinc-600 dark:text-zinc-400">
                          {cand.flagshipSkuName} ({cand.flagshipBottleSize} · {cand.flagshipAbv}) · 1P £
                          {Number(cand.flagshipWholesaleGbp || 18).toFixed(2)} vs RRP £
                          {Number(cand.flagshipRrpGbp || 29).toFixed(2)} ({marginPct}% spread)
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-500 truncate">
                          {cand.amazonUkPresence}
                        </span>
                        {committedId ? (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectBrandAndOpen(committedId, 'brand-intelligence');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-semibold shrink-0 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Open Dossier</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCommitCandidate(cand, idx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white font-semibold shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Directory</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {!loading && candidates.length === 0 && !error && (
          <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-center space-y-1.5">
            <Sparkles className="w-4 h-4 text-[#FF6A00] mx-auto" />
            <div className="font-semibold text-black dark:text-white">
              Select a target region, drink category, and objective criterion above
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">
              AI Market Scout searches across global producers outside your current {brands.length}-brand roster and scores each match on mutual 1P partnership economics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
