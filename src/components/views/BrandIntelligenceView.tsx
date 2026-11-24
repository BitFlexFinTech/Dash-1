import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, ExternalLink, LineChart, Mail, Sparkles } from 'lucide-react';
import {
  AMAZON_UK_LISTINGS,
  BRANDS,
  DISTILLER_DIRECTORY,
  EVIDENCE_RECORDS,
  OPPORTUNITY_ASSESSMENTS,
  PRODUCTS,
  UK_DISTRIBUTION_RECORDS,
} from '../../data/bwsData';
import {
  AiModelRoutingConfig,
  BrandProfile,
  DistillerManufacturerRecord,
  NavSectionId,
  OutreachLogRecord,
  ProductSku,
} from '../../types/bws';
import {
  DEFAULT_AI_ROUTING,
} from '../../data/bwsData';
import {
  EvidenceLedger,
  OpportunityStatusText,
  ProductVisual,
  PrototypeBannerNote,
  SectionHeader,
  VerificationLabel,
} from '../ui/SharedPrimitives';
import { OutreachPitchDrawer } from './IntelligenceWorkspaces';
import {
  CompetitorRadarChart,
  SkuPriceHistoryChart,
} from '../charts/BenchmarkAndPriceCharts';
import { computeMutualBenefitAnalysis } from '../../utils/bwsAnalytics';

interface AiBriefPayload {
  engineUsed: string;
  summary: string;
  ukRouteRecommendation: string;
  vendorCentralStrategy: string;
  complianceFlags: string[];
  nextSteps: string[];
}

export const BrandIntelligenceView: React.FC<{
  selectedBrandId: string;
  brands?: BrandProfile[];
  distillers?: DistillerManufacturerRecord[];
  skus?: ProductSku[];
  outreachLogs?: Record<string, OutreachLogRecord>;
  aiRouting?: AiModelRoutingConfig;
  onSelectBrand: (brandId: string) => void;
  onNavigate: (section: NavSectionId) => void;
  onSelectCountryAndOpen: (countryId: string) => void;
  onUpdateOutreachLog?: (record: OutreachLogRecord) => void;
}> = ({
  selectedBrandId,
  brands = BRANDS,
  distillers = DISTILLER_DIRECTORY,
  skus = PRODUCTS,
  outreachLogs = {},
  aiRouting,
  onSelectBrand,
  onNavigate,
  onSelectCountryAndOpen,
  onUpdateOutreachLog,
}) => {
  const brand = brands.find((b) => b.id === selectedBrandId) || brands[0];
  const brandSkus = skus.filter((p) => p.brandId === brand.id);
  const ukRecords = UK_DISTRIBUTION_RECORDS.filter((r) => r.brandId === brand.id);
  const amzRecords = AMAZON_UK_LISTINGS.filter((a) => a.brandId === brand.id);
  const oppRecord = OPPORTUNITY_ASSESSMENTS.find((o) => o.brandId === brand.id);
  const distiller = distillers.find((d) => d.brandId === brand.id);
  const outreach = outreachLogs[brand.id];
  const brandEvidence = EVIDENCE_RECORDS.filter(
    (e) => e.entityId === brand.id || e.entityId === brand.countryId
  );

  const [aiBrief, setAiBrief] = useState<AiBriefPayload | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [pitchDrawerOpen, setPitchDrawerOpen] = useState(false);
  const [localOutreachFallback, setLocalOutreachFallback] = useState<OutreachLogRecord | null>(null);
  const [expandedPriceSkuIds, setExpandedPriceSkuIds] = useState<Record<string, boolean>>({});

  const mutualBenefit = useMemo(
    () =>
      computeMutualBenefitAnalysis(
        brand,
        skus,
        AMAZON_UK_LISTINGS,
        UK_DISTRIBUTION_RECORDS,
        OPPORTUNITY_ASSESSMENTS
      ),
    [brand, skus]
  );

  const toggleSkuPriceHistory = (skuId: string) => {
    setExpandedPriceSkuIds((prev) => ({ ...prev, [skuId]: !prev[skuId] }));
  };

  const effectiveOutreachLog: OutreachLogRecord =
    localOutreachFallback && localOutreachFallback.brandId === brand.id
      ? localOutreachFallback
      : outreach || {
          brandId: brand.id,
          outreachStatus: 'Not Contacted',
          contactPerson: distiller?.exportContactRole || 'Export Director',
          contactRole: distiller?.exportContactRole || 'Export & UK Commercial',
          contactEmail: distiller?.exportContactEmail || `exports@${brand.website}`,
          lastContacted: 'Not yet contacted',
          nextFollowUp: new Date().toISOString().slice(0, 10),
          discussionNotes: '',
        };

  const handleGenerateBrief = async () => {
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await fetch('/api/research/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          briefType: 'vendor-central',
          selectedModelId: aiRouting?.research,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to generate AI research brief.');
      setAiBrief(data as AiBriefPayload);
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : 'Research AI call failed.');
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Brand Intelligence Dossier · Vendor Central UK (1P)"
        title={brand.name}
        description={`${brand.countryName} (${brand.region}) · ${brand.categories.join(' / ')} · Stage: ${brand.pipelineStage}`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={brand.id}
              onChange={(e) => {
                onSelectBrand(e.target.value);
                setAiBrief(null);
                setBriefError(null);
              }}
              aria-label="Switch brand dossier"
              className="px-3 py-2 text-xs font-medium bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.countryName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPitchDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Draft Tailored 1P Pitch</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('opportunity-assessment')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Assess Opportunity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      <PrototypeBannerNote text="Commercial roles (brand owner, distiller/producer, UK importer/distributor, and Amazon Vendor Central UK 1P vs 3P sellers) are separated and cross-checked with reviewed sources." />

      {/* Connected Intelligence Context Trail */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => onSelectCountryAndOpen(brand.countryId)}
            className="font-medium text-black dark:text-white hover:text-[#FF6A00] cursor-pointer"
          >
            {brand.countryName} Country Profile
          </button>
          <span aria-hidden="true">→</span>
          <span className="font-semibold text-[#FF6A00]">{brand.name}</span>
          <span aria-hidden="true">→</span>
          <button
            type="button"
            onClick={() => onNavigate('uk-distribution')}
            className="hover:text-black dark:hover:text-white underline decoration-zinc-300 dark:decoration-zinc-700 cursor-pointer"
          >
            UK Distribution ({ukRecords.length})
          </button>
          <span aria-hidden="true">→</span>
          <button
            type="button"
            onClick={() => onNavigate('amazon-uk')}
            className="hover:text-black dark:hover:text-white underline decoration-zinc-300 dark:decoration-zinc-700 cursor-pointer"
          >
            Amazon UK ({amzRecords.length})
          </button>
          <span aria-hidden="true">→</span>
          <button
            type="button"
            onClick={() => onNavigate('acquisition-pipeline')}
            className="hover:text-black dark:hover:text-white underline decoration-zinc-300 dark:decoration-zinc-700 cursor-pointer"
          >
            Outreach: {outreach?.outreachStatus || brand.pipelineStage}
          </button>
        </div>

        <OpportunityStatusText status={brand.opportunityStatus} />
      </div>

      {/* Outreach & AI Research Brief Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black dark:text-white">
              Outreach & Discussion Tracker
            </h2>
            <span className="font-mono font-semibold text-[#FF6A00]">
              {outreach?.outreachStatus || 'Not Contacted'}
            </span>
          </div>
          {outreach ? (
            <div className="space-y-1.5 text-zinc-600 dark:text-zinc-300">
              <div>
                <strong className="text-black dark:text-white">Contact:</strong> {outreach.contactPerson} ({outreach.contactRole})
              </div>
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <Mail className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>{outreach.contactEmail}</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Last Contacted: {outreach.lastContacted} · Next Follow-Up: {outreach.nextFollowUp}
              </div>
              <p className="pt-1 text-zinc-700 dark:text-zinc-300">{outreach.discussionNotes}</p>
            </div>
          ) : (
            <p className="text-zinc-500">No outreach logged yet. Open Acquisition Pipeline to draft first pitch.</p>
          )}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => setPitchDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 font-semibold text-[#FF6A00] hover:underline cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Draft Tailored 1P Pitch & Amazon Audit</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('acquisition-pipeline')}
              className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <span>Pipeline Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-black dark:text-white">
                AI Route-to-UK & Vendor Central 1P Intelligence Brief
              </h2>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Uses Admin-configured Research AI ({aiRouting?.research || 'Built-in Gemini'})
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateBrief}
              disabled={briefLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white font-semibold disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{briefLoading ? 'Analysing Brand...' : 'Generate AI Research Brief'}</span>
            </button>
          </div>

          {briefError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300">
              {briefError}
            </div>
          )}

          {aiBrief ? (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex justify-between text-[11px] font-mono text-[#FF6A00]">
                <span>LIVE AI BRIEF GENERATED</span>
                <span>{aiBrief.engineUsed}</span>
              </div>
              <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed">{aiBrief.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <strong className="text-black dark:text-white">UK Bond / WePrep Route:</strong>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{aiBrief.ukRouteRecommendation}</p>
                </div>
                <div>
                  <strong className="text-black dark:text-white">Vendor Central 1P Strategy:</strong>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{aiBrief.vendorCentralStrategy}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              Click &ldquo;Generate AI Research Brief&rdquo; to evaluate {brand.name} across UK AWRS/excise routing (3P Wet-Bond vs WePrep duty-paid) and Amazon Vendor Central UK (1P) buy-box positioning.
            </div>
          )}
        </div>
      </div>

      {/* 1. Brand Identity & Ownership / Production Separation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-black dark:text-white">Brand Identity</h2>
            <a
              href={`https://${brand.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-[#FF6A00] hover:underline"
            >
              <span>{brand.website}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{brand.description}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Country & Region</dt>
              <dd className="mt-0.5 font-medium text-black dark:text-white">
                {brand.countryName} · {brand.region}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Product Categories</dt>
              <dd className="mt-0.5 font-medium text-black dark:text-white">
                {brand.categories.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Research Status</dt>
              <dd className="mt-0.5 font-medium text-black dark:text-white">{brand.researchStatus}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Est. Pipeline Potential</dt>
              <dd className="mt-0.5 font-mono font-semibold text-[#FF6A00]">
                £{brand.illustrativePipelineValueGbp.toLocaleString()} / yr
              </dd>
            </div>
          </dl>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-black dark:text-white">
              Ownership, Producer & UK Distributor Contacts
            </h2>
            <VerificationLabel status={brand.ownershipVerification} />
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Legal Brand Owner</dt>
              <dd className="mt-0.5 font-semibold text-black dark:text-white">{brand.brandOwner}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Parent Company</dt>
              <dd className="mt-0.5 font-medium text-black dark:text-white">{brand.parentCompany}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Manufacturer / Distiller</dt>
              <dd className="mt-0.5 font-medium text-black dark:text-white">{brand.manufacturer}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">UK Distributor Contact</dt>
              <dd className="mt-0.5 font-medium text-black dark:text-white">
                {distiller ? `${distiller.ukDistributorName} (${distiller.ukDistributorContact})` : brand.ukImporterOrDistributor}
              </dd>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <dt className="text-zinc-500 dark:text-zinc-400">Licensing or Ownership Arrangements</dt>
              <dd className="mt-0.5 text-zinc-700 dark:text-zinc-300">{brand.licensingArrangement}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 2. Product Range */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-black dark:text-white">
              Product Range & Packaging Specifications (Synced with Partner Portal)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {brand.productRangeSummary}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('product-catalogue')}
            className="text-xs font-semibold text-[#FF6A00] hover:underline cursor-pointer"
          >
            Open Full Catalogue →
          </button>
        </div>

        {brandSkus.length === 0 ? (
          <div className="p-6 text-xs text-zinc-500 dark:text-zinc-400">
            Individual SKU specifications are being compiled for this brand ({brand.productRangeSummary}).
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {brandSkus.map((sku) => {
              const isExpanded = Boolean(expandedPriceSkuIds[sku.id]);
              return (
                <div key={sku.id} className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                    <div className="flex gap-4 items-start min-w-0">
                      <ProductVisual
                        src={sku.imageUrl}
                        alt={sku.name}
                        className="w-24 h-24 object-contain bg-white dark:bg-zinc-950 p-1.5 shrink-0 border border-zinc-200 dark:border-zinc-800"
                      />
                      <div className="min-w-0 space-y-1.5 text-xs">
                        <div className="font-semibold text-black dark:text-white">{sku.name}</div>
                        <div className="text-zinc-500 dark:text-zinc-400">
                          {sku.productType} · {sku.bottleSize} ·{' '}
                          <span className="font-mono">{sku.abv} ABV</span>
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-300">Format: {sku.packFormat}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {sku.tastingNotes || sku.packagingInfo}
                        </div>
                        <div className="pt-1 font-mono tabular-nums text-[11px] text-black dark:text-white">
                          1P Wholesale Est: £{sku.illustrativeWholesaleGbp.toFixed(2)} · Target RRP: £
                          {sku.illustrativeRrpGbp.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSkuPriceHistory(sku.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:border-[#FF6A00] text-black dark:text-white whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <LineChart className="w-3.5 h-3.5 text-[#FF6A00]" />
                      <span>12M UK Price Trend</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <SkuPriceHistoryChart
                      sku={sku}
                      brand={brand}
                      amazonListing={amzRecords[0]}
                      compact
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2B. Mutual Benefit ("Win-Win") Analysis & Competitor Benchmarking Radar */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="text-[11px] font-mono text-[#FF6A00]">
              Objective Two-Way Partnership Case · {mutualBenefit.fitTier}
            </div>
            <h2 className="text-sm font-semibold text-black dark:text-white mt-0.5">
              How Partnering with Mercenta Creates Mutual Value ({brand.name} × Vendor Central UK 1P)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {mutualBenefit.mutualVerdict}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono tabular-nums text-xl font-bold text-[#FF6A00]">
              {mutualBenefit.objectiveFitScore} / 100
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Unbiased Fit Score
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">1P Wholesale Margin</div>
            <div className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              £{mutualBenefit.wholesaleMarginPerUnitGbp.toFixed(2)}/unit ({mutualBenefit.wholesaleMarginPct}%)
            </div>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Amazon UK Drift vs RRP</div>
            <div className="font-mono tabular-nums font-bold text-black dark:text-white mt-0.5">
              {mutualBenefit.pricingDriftGbp >= 0
                ? `+£${mutualBenefit.pricingDriftGbp.toFixed(2)}`
                : `-£${Math.abs(mutualBenefit.pricingDriftGbp).toFixed(2)}`}{' '}
              ({mutualBenefit.pricingDriftPct >= 0 ? `+${mutualBenefit.pricingDriftPct}%` : `${mutualBenefit.pricingDriftPct}%`})
            </div>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Projected Annual 1P POs</div>
            <div className="font-mono tabular-nums font-bold text-[#FF6A00] mt-0.5">
              £{mutualBenefit.estimatedAnnual1pPoGbp.toLocaleString()} / yr
            </div>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">UK 1P Logistics Fit</div>
            <div className="font-medium text-black dark:text-white mt-0.5 truncate" title={mutualBenefit.recommendedLogisticsPathway}>
              {mutualBenefit.recommendedLogisticsPathway}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="font-mono text-[11px] font-semibold text-[#FF6A00]">
              What {brand.name} Gains
            </div>
            <div className="font-semibold text-black dark:text-white">
              {mutualBenefit.brandGains.headline}
            </div>
            <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-300 list-disc pl-4">
              <li>{mutualBenefit.brandGains.priceIntegrityRecovery}</li>
              <li>{mutualBenefit.brandGains.channelAndLogisticsWin}</li>
              <li>{mutualBenefit.brandGains.conversionAndAPlusWin}</li>
              <li>{mutualBenefit.brandGains.distributorCoexistence}</li>
            </ul>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              What Mercenta Gains (Vendor Central UK 1P)
            </div>
            <div className="font-semibold text-black dark:text-white">
              {mutualBenefit.mercentaGains.headline}
            </div>
            <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-300 list-disc pl-4">
              <li>{mutualBenefit.mercentaGains.marginSpreadSummary}</li>
              <li>{mutualBenefit.mercentaGains.poVolumeSummary}</li>
              <li>{mutualBenefit.mercentaGains.categoryWhitespaceSummary}</li>
            </ul>
          </div>
        </div>
      </div>

      <CompetitorRadarChart
        selectedBrand={brand}
        brands={brands}
        skus={skus}
        amazonListings={AMAZON_UK_LISTINGS}
      />

      {/* 3. International Presence & UK Presence Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            International Market Presence
          </h2>
          <div className="text-xs space-y-2">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Active Countries: </span>
              <span className="font-medium text-black dark:text-white">
                {brand.internationalMarkets.join(' · ')}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Retail & Marketplace Footprint: </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {brand.retailAndMarketplacePresence}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Known Distributors & Representatives
            </div>
            <div className="space-y-2">
              {brand.internationalDistributors.map((d) => (
                <div
                  key={`${d.market}-${d.organisation}`}
                  className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-black dark:text-white">{d.organisation}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {d.market} · Role: {d.role}
                    </div>
                  </div>
                  <VerificationLabel status={d.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-black dark:text-white">
              UK Market & Vendor Central (1P) Intelligence
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('uk-distribution')}
              className="text-xs font-semibold text-[#FF6A00] hover:underline cursor-pointer"
            >
              Full UK Audit →
            </button>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">UK Availability</dt>
              <dd className="mt-0.5 font-semibold text-black dark:text-white">{brand.ukPresenceStatus}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Arrangement Type</dt>
              <dd className="mt-0.5 font-semibold text-[#FF6A00]">{brand.ukArrangementType}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500 dark:text-zinc-400">UK Importer / Distributor / Agent Note</dt>
              <dd className="mt-0.5 text-zinc-700 dark:text-zinc-300">{brand.ukImporterOrDistributor}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Amazon UK Presence (&ldquo;Sold by Amazon&rdquo; Signal)</dt>
              <dd className="mt-0.5 font-semibold text-black dark:text-white">{brand.amazonUkPresence}</dd>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {brand.amazonUkPresence.includes("No 'Sold by Amazon'")
                  ? 'No "Dispatched from and sold by Amazon" Buy Box owner observed — strong candidate for Mercenta Partners to pitch direct Vendor Central UK (1P) representation.'
                  : '"Dispatched from and sold by Amazon" appears on Amazon.co.uk, indicating an existing Vendor Central (1P) wholesale relationship (focus pitch on range expansion & 3P Buy Box cleanup).'}
              </p>
            </div>
          </dl>

          {oppRecord && (
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-black dark:text-white">Opportunity Rubric Score</span>
                <span className="font-mono font-bold text-[#FF6A00]">{oppRecord.overallScore} / 100</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">{oppRecord.summaryRationale}</p>
              <div className="pt-1 font-medium text-black dark:text-white">
                Next Action: {brand.nextAction}
              </div>
            </div>
          )}
        </div>
      </div>

      <EvidenceLedger
        records={brandEvidence}
        title={`Verified Sources & Evidence — ${brand.name}`}
      />

      {pitchDrawerOpen && (
        <OutreachPitchDrawer
          brand={brand}
          distiller={distiller}
          outreachLog={effectiveOutreachLog}
          skus={skus}
          aiRouting={aiRouting || DEFAULT_AI_ROUTING}
          onUpdateOutreachLog={(rec) => {
            setLocalOutreachFallback(rec);
            if (onUpdateOutreachLog) onUpdateOutreachLog(rec);
          }}
          onClose={() => setPitchDrawerOpen(false)}
        />
      )}
    </div>
  );
};
