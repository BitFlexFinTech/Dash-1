import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  ExternalLink,
  ListChecks,
  Lock,
  Moon,
  RotateCcw,
  Server,
  Sun,
} from 'lucide-react';
import {
  ADMIN_LAUNCH_CHECKLIST,
  AI_MODEL_CATALOG,
  BRANDS,
  COUNTRIES,
  DEFAULT_AI_ROUTING,
  GROWTH_SERIES,
  PORTFOLIO_BRANDS,
  PRODUCTS,
  UK_DISTRIBUTION_RECORDS,
} from '../../data/bwsData';
import {
  AiModelRoutingConfig,
  AiTaskSlot,
  BrandProfile,
  ChecklistStatus,
} from '../../types/bws';
import {
  MetricStrip,
  PrototypeBannerNote,
  SectionHeader,
} from '../ui/SharedPrimitives';
import { DualRevenueChart, HorizontalBarChart } from '../charts/AnalyticsCharts';

/* ============================================================================
 * 21. BRAND GROWTH (STRICTLY AMAZON VENDOR CENTRAL UK 1P — REAL BRANDS)
 * ========================================================================== */
export const BrandGrowthView: React.FC = () => {
  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Marketplace Expansion & Performance"
        title="Brand Growth — Amazon Vendor Central UK (1P) & Trade"
        description="Commercial growth dashboards tracking partner sell-through on Amazon.co.uk 1P Vendor Central, A+ Content uplift, range expansion, and compliant UK advertising visibility."
      />

      <PrototypeBannerNote text="Sales velocity, Buy Box control, and listing quality indices cover Mercenta's Amazon Vendor Central UK (1P) and UK wholesale stewardship." />

      <MetricStrip
        items={[
          {
            label: 'Amazon UK 1P Monthly Run-Rate',
            value: '£72,400',
            detail: 'Nov Vendor Central 1P sell-through',
            highlight: true,
          },
          {
            label: 'Average Listing Quality Index',
            value: '91 / 100',
            detail: 'A+ Content & Brand Registry active',
          },
          {
            label: '1P Buy Box Stewardship Rate',
            value: '97.4%',
            detail: 'Sold & dispatched by Amazon 1P',
            highlight: true,
          },
          {
            label: 'Range Expansion Pipeline',
            value: '+8 SKUs',
            detail: 'Gift cartons & multi-bottle cases',
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DualRevenueChart
          title="6-Month Channel Revenue Trajectory (Illustrative)"
          subtitle="Combined UK Trade Wholesale vs. Amazon Vendor Central UK (1P)"
          data={GROWTH_SERIES}
        />

        <HorizontalBarChart
          title="Amazon.co.uk 1P Listing Readiness by Brand"
          subtitle="Composite score across imagery, A+ modules, ABV% compliance & 1P Buy Box"
          items={[
            { label: 'The GlenAllachie (Speyside 1P)', value: 96, valueLabel: '96% Strong', highlight: true },
            { label: 'Mount Gay Rum (Barbados 1P)', value: 93, valueLabel: '93% Strong', highlight: true },
            { label: 'Chopin Vodka (3P → 1P Target)', value: 81, valueLabel: '81% Ready' },
            { label: 'Kanonkop Wine Estate (Prep)', value: 78, valueLabel: '78% Prep' },
            { label: 'Bisol 1542 Prosecco (Fragmented 3P)', value: 36, valueLabel: '36% Target' },
          ]}
        />
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Active Amazon Vendor Central UK (1P) Growth Initiatives
          </h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
              <th className="py-3 px-4">Partner Brand</th>
              <th className="py-3 px-4">Growth Lever</th>
              <th className="py-3 px-4">Amazon 1P Scope</th>
              <th className="py-3 px-4">Current Performance Note</th>
              <th className="py-3 px-4 text-right">Illustrative Upside</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {PORTFOLIO_BRANDS.map((pf) => (
              <tr key={pf.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                <td className="py-3.5 px-4 font-semibold text-black dark:text-white whitespace-nowrap">
                  {pf.brandName}
                </td>
                <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 min-w-[220px]">
                  {pf.growthOpportunity}
                </td>
                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 min-w-[220px]">
                  {pf.amazonUkStatus}
                </td>
                <td className="py-3.5 px-4 font-mono text-black dark:text-white whitespace-nowrap">
                  {pf.illustrativeYoyGrowthPct > 0
                    ? `+${pf.illustrativeYoyGrowthPct}% YoY`
                    : 'Pre-Launch'}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#FF6A00] whitespace-nowrap">
                  £{pf.illustrativeAnnualRevenueGbp.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================================
 * 22. FINANCIALS (STRICTLY VENDOR CENTRAL 1P — ZERO FBA)
 * ========================================================================== */
export const FinancialsView: React.FC<{
  brands?: BrandProfile[];
}> = ({ brands = BRANDS }) => {
  const totalPipeline = brands.reduce((a, b) => a + b.illustrativePipelineValueGbp, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Commercial Economics"
        title="Financial Overview"
        description="Wholesale revenue, post-excise gross margin profile, product unit spread, and weighted commercial pipeline across Amazon Vendor Central UK (1P) and UK trade."
      />

      <PrototypeBannerNote text="Financial figures model 1P Vendor Central PO margins after UK excise duty, 3P wet-bond rent, and WePrep/DHL fulfilment costs." />

      <MetricStrip
        items={[
          {
            label: 'LTM Wholesale + 1P Vendor Central',
            value: '£948,000',
            detail: 'Active partner portfolio run-rate',
            highlight: true,
          },
          {
            label: 'Blended Gross Margin (Post-Duty)',
            value: '28.4%',
            detail: 'After HMRC excise & WePrep 1P prep',
          },
          {
            label: 'Commercial Discovery Pipeline',
            value: `£${(totalPipeline / 1000000).toFixed(2)}M`,
            detail: `Across ${brands.length} researched international brands`,
            highlight: true,
          },
          {
            label: 'Average 1P Vendor Central PO Value',
            value: '£18,750',
            detail: 'WePrep 1P & DHL Credit direct-ship POs',
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DualRevenueChart
          title="Illustrative Monthly Sales Trend (GBP)"
          subtitle="UK Trade Wholesale & Amazon Vendor Central UK (1P) Split"
          data={GROWTH_SERIES}
        />

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-black dark:text-white">
              Illustrative Product Unit Economics (1P Wholesale vs. Target UK RRP)
            </h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4 text-right">1P Cost</th>
                <th className="py-2.5 px-4 text-right">Target RRP</th>
                <th className="py-2.5 px-4 text-right">Spread</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {PRODUCTS.slice(0, 6).map((p) => {
                const spreadPct = Math.round(
                  ((p.illustrativeRrpGbp - p.illustrativeWholesaleGbp) /
                    p.illustrativeRrpGbp) *
                    100
                );
                return (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-medium text-black dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                      £{p.illustrativeWholesaleGbp.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-black dark:text-white">
                      £{p.illustrativeRrpGbp.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#FF6A00]">
                      {spreadPct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 23. REPORTS & ANALYTICS
 * ========================================================================== */
export const ReportsAnalyticsView: React.FC = () => {
  const topCountries = [...COUNTRIES]
    .sort((a, b) => b.brandsDiscoveredCount - a.brandsDiscoveredCount)
    .slice(0, 6)
    .map((c) => ({
      label: c.name,
      value: c.brandsDiscoveredCount,
      valueLabel: `${c.brandsDiscoveredCount} brands`,
      highlight: c.commercialOpportunityIndicator === 'Primary Focus',
    }));

  const ukDistSummary = [
    {
      label: 'Verified Relationship / Agency',
      value: UK_DISTRIBUTION_RECORDS.filter((r) => r.verificationStatus === 'Verified').length,
      valueLabel: `${UK_DISTRIBUTION_RECORDS.filter((r) => r.verificationStatus === 'Verified').length} records`,
      highlight: true,
    },
    {
      label: 'Partially Verified',
      value: UK_DISTRIBUTION_RECORDS.filter((r) => r.verificationStatus === 'Partially Verified').length,
      valueLabel: `${UK_DISTRIBUTION_RECORDS.filter((r) => r.verificationStatus === 'Partially Verified').length} records`,
    },
    {
      label: 'Requires Verification / Unknown',
      value: UK_DISTRIBUTION_RECORDS.filter(
        (r) =>
          r.verificationStatus === 'Requires Verification' ||
          r.verificationStatus === 'Unknown' ||
          r.verificationStatus === 'Not Found in Reviewed Sources'
      ).length,
      valueLabel: `${
        UK_DISTRIBUTION_RECORDS.filter(
          (r) =>
            r.verificationStatus === 'Requires Verification' ||
            r.verificationStatus === 'Unknown' ||
            r.verificationStatus === 'Not Found in Reviewed Sources'
        ).length
      } records`,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Intelligence Reporting"
        title="Reports & Analytics"
        description="Cross-platform analytical breakdown across country discovery, drinks categories, UK distribution verification, Amazon Vendor Central UK (1P) footprint, and pipeline conversion."
      />

      <PrototypeBannerNote text="Analytical charts and summary tables generated from Mercenta's international BWS dataset." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HorizontalBarChart
          title="Brands Discovered by Country (Top 6 Markets)"
          subtitle="Orange highlights denote Primary Focus sourcing territories"
          items={topCountries}
        />

        <HorizontalBarChart
          title="UK Distribution Verification Status"
          subtitle="Audit completeness across reviewed UK trade records"
          items={ukDistSummary}
        />
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Country-to-Opportunity Analytical Summary
          </h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
              <th className="py-2.5 px-4">Country</th>
              <th className="py-2.5 px-4">Primary Categories</th>
              <th className="py-2.5 px-4 text-right">Mapped Brands</th>
              <th className="py-2.5 px-4 text-right">Unclear UK Rep.</th>
              <th className="py-2.5 px-4 text-right">Acquisition Targets</th>
              <th className="py-2.5 px-4">UK Presence</th>
              <th className="py-2.5 px-4">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {COUNTRIES.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                <td className="py-3 px-4 font-semibold text-black dark:text-white">{c.name}</td>
                <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                  {c.categories.join(', ')}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {c.brandsDiscoveredCount}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#FF6A00]">
                  {c.unclearRepresentationCount}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {c.acquisitionCandidatesCount}
                </td>
                <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                  {c.ukPresenceIndicator}
                </td>
                <td className="py-3 px-4 font-medium text-black dark:text-white">
                  {c.commercialOpportunityIndicator}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================================
 * 24. ADMIN & SETTINGS: PRE-BRAND LAUNCH CHECKLIST + AI COST CONTROL ROUTER
 * ========================================================================== */
const AI_TASK_SLOTS: {
  slot: AiTaskSlot;
  title: string;
  description: string;
  lockedToBuiltInGemini?: boolean;
}[] = [
  {
    slot: 'outreach',
    title: 'Brand Outreach & Pitch Email Generation',
    description: 'Drafts personalized B2B cold intros & follow-ups in Acquisition Pipeline.',
  },
  {
    slot: 'research',
    title: 'Brand & UK Distributor Research Briefs',
    description: 'Analyses UK route-to-market, distributor conflicts & Vendor Central 1P gaps.',
  },
  {
    slot: 'compliance',
    title: 'Regulatory, Excise & Risk Pre-Screen',
    description: 'Checks AWRS, UK labelling, wet-bond vs WePrep & CAP Code flags.',
  },
  {
    slot: 'campaignCopy',
    title: 'Campaign Studio Copy & UK Compliance Engine',
    description: 'Locked to built-in Gemini AI (gemini-4-hydrogen) during build phase.',
    lockedToBuiltInGemini: true,
  },
  {
    slot: 'campaignImage',
    title: 'Campaign Studio — Lifestyle & Banner Images',
    description: 'Task-filtered image models only for 1200×628 banners, Posts & 500×500 companions.',
  },
  {
    slot: 'campaignVideo',
    title: 'Campaign Studio — Video Spots & CTV Reels',
    description: 'Task-filtered video models only for Search Video, Prime Video, Fire TV & Twitch.',
  },
];

export const SettingsView: React.FC<{
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
  checklistStatuses: Record<string, ChecklistStatus>;
  onUpdateChecklistStatus: (itemId: string, status: ChecklistStatus) => void;
  aiRouting: AiModelRoutingConfig;
  onUpdateAiRouting: (slot: AiTaskSlot, modelId: string) => void;
  onResetDefaults: () => void;
}> = ({
  theme,
  onSetTheme,
  checklistStatuses,
  onUpdateChecklistStatus,
  aiRouting,
  onUpdateAiRouting,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'ai' | 'preferences'>('checklist');
  const [pillarFilter, setPillarFilter] = useState<string>('All');
  const [serverStatus, setServerStatus] = useState<{
    geminiConfigured: boolean;
    aiStudioActive?: boolean;
    openrouterConfigured: boolean;
    lockedCampaignEngine: string;
    activeBuildProvider?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((data) => setServerStatus(data))
      .catch(() => setServerStatus(null));
  }, []);

  const checklistScore = ADMIN_LAUNCH_CHECKLIST.reduce((sum, item) => {
    const st = checklistStatuses[item.id] || item.defaultStatus;
    return sum + (st === 'Sorted' ? 1 : st === 'In Progress' ? 0.5 : 0);
  }, 0);
  const readinessPct = Math.round((checklistScore / ADMIN_LAUNCH_CHECKLIST.length) * 100);
  const sortedCount = ADMIN_LAUNCH_CHECKLIST.filter(
    (item) => (checklistStatuses[item.id] || item.defaultStatus) === 'Sorted'
  ).length;
  const inProgressCount = ADMIN_LAUNCH_CHECKLIST.filter(
    (item) => (checklistStatuses[item.id] || item.defaultStatus) === 'In Progress'
  ).length;

  const filteredChecklist = ADMIN_LAUNCH_CHECKLIST.filter(
    (item) => pillarFilter === 'All' || item.pillar === pillarFilter
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Admin & Governance Console"
        title="Pre-Brand Launch Readiness & AI Cost Control"
        description="Track every legal, HMRC, WePrep/Wet-Bond, Direct Debit/UKWA insurance, and Vendor Central UK (1P) requirement with real official portal links before approaching brands—and route AI tasks to the lowest-cost models."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  activeTab === 'checklist'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-500'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Launch Checklist ({readinessPct}%)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-500'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>AI Engine & Cost Router</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  activeTab === 'preferences'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-500'
                }`}
              >
                Theme & Taxonomy
              </button>
            </div>
          </div>
        }
      />

      {activeTab === 'checklist' && (
        <div className="space-y-5">
          {/* Overall Progress Bar Card */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-[#FF6A00]">
                  PRE-BRAND APPROACH READINESS TRACKER
                </div>
                <h2 className="text-xl font-bold text-black dark:text-white mt-0.5">
                  {readinessPct}% Ready to Approach International Brands
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {sortedCount} Sorted · {inProgressCount} In Progress ·{' '}
                  {ADMIN_LAUNCH_CHECKLIST.length - sortedCount - inProgressCount} Not Started (
                  {ADMIN_LAUNCH_CHECKLIST.length} total)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pillarFilter}
                  onChange={(e) => setPillarFilter(e.target.value)}
                  aria-label="Filter launch readiness pillar"
                  className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                >
                  <option value="All">All 4 Pillars</option>
                  <option value="HMRC & Entity">HMRC & Entity</option>
                  <option value="WePrep & Wet-Bond">WePrep & Wet-Bond</option>
                  <option value="Finance & Insurance">Finance & Insurance</option>
                  <option value="DHL & Amazon 1P">DHL & Amazon 1P</option>
                </select>
                <button
                  type="button"
                  onClick={onResetDefaults}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 hover:border-[#FF6A00] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className="h-full bg-[#FF6A00] transition-all duration-300"
                style={{ width: `${readinessPct}%` }}
              />
            </div>
          </div>

          {/* 14-Item Interactive Checklist Table with Actual External Links */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredChecklist.map((item) => {
              const status = checklistStatuses[item.id] || item.defaultStatus;
              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[#FF6A00]">
                        {item.pillar}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        Cost: {item.costNote}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                      {status === 'Sorted' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span>{item.title}</span>
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <a
                      href={item.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-300 dark:border-zinc-700 hover:border-[#FF6A00] font-semibold text-black dark:text-white whitespace-nowrap"
                    >
                      <span>{item.whereToDoItLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#FF6A00]" />
                    </a>

                    <select
                      value={status}
                      onChange={(e) =>
                        onUpdateChecklistStatus(item.id, e.target.value as ChecklistStatus)
                      }
                      aria-label={`Status for ${item.title}`}
                      className={`px-3 py-2 font-semibold border cursor-pointer ${
                        status === 'Sorted'
                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                          : status === 'In Progress'
                          ? 'border-[#FF6A00] text-[#FF6A00] bg-orange-50 dark:bg-orange-950/30'
                          : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950'
                      }`}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Sorted">Sorted</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Active AI Studio Build Mode + Post-Build OpenRouter Routing Profile (Zero Browser Key Inputs) */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-black text-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#FF6A00]">
                  <Server className="w-4 h-4" />
                  <span>AI STUDIO ACTIVE BUILD MODE & SAVED POST-BUILD OPENROUTER ROUTING</span>
                </div>
                <h2 className="text-lg font-bold">
                  Active During Build: Built-in AI Studio Gemini — Powering All Live AI Tools Now
                </h2>
                <p className="text-xs text-zinc-300 max-w-3xl">
                  While we build, <strong className="text-white">Campaign Studio, AI Brand Discovery Lookup, Research Briefs, Compliance Pre-Screen, and Outreach Pitch Drafting</strong> all execute live using AI Studio’s built-in <code className="font-mono">gemini-4-hydrogen</code>. Your task-filtered OpenRouter model picks below are saved as your <strong className="text-white">Post-Build Routing Profile</strong>—once finished, add <code className="font-mono">OPENROUTER_API_KEY</code> in <strong className="text-white">Settings → Secrets</strong> (never in browser inputs) and the server activates them automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={onResetDefaults}
                className="px-3.5 py-2 text-xs font-semibold border border-zinc-700 hover:border-[#FF6A00] text-white cursor-pointer"
              >
                Reset to Cheapest Recommended
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800 text-xs">
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="text-zinc-400">Active Build AI Provider</div>
                <div className="font-mono font-bold text-emerald-400">
                  {serverStatus?.geminiConfigured
                    ? serverStatus.activeBuildProvider || `Active (${serverStatus.lockedCampaignEngine})`
                    : 'Built-in AI Studio Gemini Ready'}
                </div>
              </div>
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="text-zinc-400">Post-Build OpenRouter Secret</div>
                <div
                  className={`font-mono font-bold ${
                    serverStatus?.openrouterConfigured ? 'text-emerald-400' : 'text-[#FF6A00]'
                  }`}
                >
                  {serverStatus?.openrouterConfigured
                    ? 'OPENROUTER_API_KEY Active on Server'
                    : 'Deferred Until Post-Build (Saved Picks Ready)'}
                </div>
              </div>
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="text-zinc-400">Free-Tier Cost Tip</div>
                <div className="text-zinc-200">
                  $0.00 <code className="font-mono text-[#FF6A00]">:free</code> models give 50 req/day ($10 top-up unlocks 1,000 req/day free).
                </div>
              </div>
            </div>
          </div>

          {/* 6 Strictly Task-Filtered AI Model Selectors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {AI_TASK_SLOTS.map((slotMeta) => {
              const eligibleModels = AI_MODEL_CATALOG.filter((m) =>
                m.tasks.includes(slotMeta.slot)
              );
              const selectedId =
                aiRouting[slotMeta.slot] || DEFAULT_AI_ROUTING[slotMeta.slot];
              const selectedModel =
                eligibleModels.find((m) => m.id === selectedId) || eligibleModels[0];

              return (
                <div
                  key={slotMeta.slot}
                  className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                        {slotMeta.lockedToBuiltInGemini && (
                          <Lock className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                        )}
                        <span>{slotMeta.title}</span>
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {slotMeta.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">
                      Select Task-Relevant Model ({eligibleModels.length} compatible)
                    </label>
                    <select
                      value={selectedModel?.id || ''}
                      disabled={Boolean(slotMeta.lockedToBuiltInGemini)}
                      onChange={(e) => onUpdateAiRouting(slotMeta.slot, e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white font-semibold disabled:opacity-75"
                    >
                      {eligibleModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.pricingLabel}{' '}
                          {m.recommendedTag ? `(${m.recommendedTag})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedModel && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="text-[#FF6A00] font-bold">
                          {selectedModel.pricingLabel}
                        </span>
                        <span className="text-zinc-500">{selectedModel.provider}</span>
                      </div>
                      <div className="text-zinc-700 dark:text-zinc-300">
                        {selectedModel.strengthNote}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        {selectedModel.rateOrLimitNote}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-black dark:text-white">
              Appearance & Theme System
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Coordinated Light and Dark themes built around Mercenta Black (#000000), White (#FFFFFF), and Orange (#FF6A00).
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onSetTheme('light')}
                className={`p-4 border text-left transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#FF6A00] bg-zinc-50 text-black'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sun className="w-4 h-4 text-[#FF6A00]" />
                  <span>Light Workspace</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  High-contrast white surfaces & charcoal typography
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                className={`p-4 border text-left transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[#FF6A00] bg-zinc-950 text-white'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Moon className="w-4 h-4 text-[#FF6A00]" />
                  <span>Dark Workspace</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Obsidian black surfaces & crisp white typography
                </div>
              </button>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-3">
            <h2 className="text-sm font-semibold text-black dark:text-white">
              Evidence & Verification Taxonomy
            </h2>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li>
                <strong className="text-black dark:text-white">Verified:</strong> Confirmed via primary registry, official filing, or direct producer documentation.
              </li>
              <li>
                <strong className="text-black dark:text-white">Partially Verified:</strong> Supporting evidence found, but territory or exclusivity scope remains incomplete.
              </li>
              <li>
                <strong className="text-black dark:text-white">Requires Verification:</strong> Conflicting or secondary retail observations require direct confirmation.
              </li>
              <li>
                <strong className="text-black dark:text-white">Not Found in Reviewed Sources:</strong> Checked across reviewed directories without an identified UK record.
              </li>
              <li>
                <strong className="text-black dark:text-white">Unknown:</strong> Insufficient source material reviewed to establish commercial arrangement.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
