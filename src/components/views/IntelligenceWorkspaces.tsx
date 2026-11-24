import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Columns3,
  Compass,
  Copy,
  List,
  Mail,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import {
  AMAZON_UK_LISTINGS,
  BRANDS,
  COUNTRIES,
  DISTILLER_DIRECTORY,
  EVIDENCE_RECORDS,
  OPPORTUNITY_ASSESSMENTS,
  PIPELINE_STAGES,
  PRODUCTS,
  UK_DISTRIBUTION_RECORDS,
} from '../../data/bwsData';
import {
  AiModelRoutingConfig,
  BrandProfile,
  DistillerManufacturerRecord,
  DrinkCategory,
  NavSectionId,
  OutreachAmazonAudit,
  OutreachLogRecord,
  OutreachStatus,
  ProductSku,
  VerificationStatus,
} from '../../types/bws';
import { AiMarketScoutModal } from '../ui/AiMarketScoutModal';
import { ALL_DRINK_CATEGORIES } from '../ui/MultiSelectCategoryFilter';
import {
  EvidenceLedger,
  MetricStrip,
  OpportunityStatusText,
  ProductVisual,
  PrototypeBannerNote,
  SectionHeader,
  VerificationLabel,
} from '../ui/SharedPrimitives';
import { computeMutualBenefitAnalysis } from '../../utils/bwsAnalytics';

/* ============================================================================
 * 9. UK DISTRIBUTION RESEARCH
 * ========================================================================== */
export const UkDistributionView: React.FC<{
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
}> = ({ onSelectBrandAndOpen }) => {
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UK_DISTRIBUTION_RECORDS.filter((r) => {
      const matchesQ =
        !q ||
        r.brandName.toLowerCase().includes(q) ||
        r.organisation.toLowerCase().includes(q) ||
        r.contactInfo.toLowerCase().includes(q) ||
        r.evidenceSummary.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All' || r.commercialRole === roleFilter;
      const matchesStatus = statusFilter === 'All' || r.verificationStatus === statusFilter;
      return matchesQ && matchesRole && matchesStatus;
    });
  }, [roleFilter, statusFilter, query]);

  const verifiedCount = UK_DISTRIBUTION_RECORDS.filter(
    (r) => r.verificationStatus === 'Verified'
  ).length;
  const requiresCheck = UK_DISTRIBUTION_RECORDS.filter(
    (r) =>
      r.verificationStatus === 'Requires Verification' ||
      r.verificationStatus === 'Unknown' ||
      r.verificationStatus === 'Not Found in Reviewed Sources'
  ).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="UK Channel & Agency Audit"
        title="UK Distribution Research"
        description="Structured audit of UK importers, distributors, agents, and Vendor Central UK (1P) vs. 3P marketplace sellers including public UK trade contact desks."
      />

      <PrototypeBannerNote text="Research standard: stocking a product at retail or as a 3P marketplace offer does not imply exclusive UK distribution or Amazon Vendor Central UK (1P) stewardship." />

      <MetricStrip
        items={[
          {
            label: 'Distribution Records Audited',
            value: String(UK_DISTRIBUTION_RECORDS.length),
            detail: 'Across active global BWS targets',
          },
          {
            label: 'Verified Relationships',
            value: String(verifiedCount),
            detail: 'Confirmed UK agency or brand subsidiary',
            highlight: true,
          },
          {
            label: 'Requires Verification / 1P Check',
            value: String(requiresCheck),
            detail: 'Open for Vendor Central 1P dialogue',
          },
          {
            label: 'Unverified 3P / Grey Offers',
            value: String(
              UK_DISTRIBUTION_RECORDS.filter(
                (r) =>
                  r.relationshipType === 'Unverified Reseller Activity' ||
                  r.relationshipType === 'Vendor Central 1P Opportunity'
              ).length
            ),
            detail: 'Target for authorised 1P stewardship',
          },
        ]}
      />

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand, UK agency, contact email..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by commercial role"
          className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
        >
          <option value="All">All Commercial Roles</option>
          <option value="UK Distributor">UK Distributor</option>
          <option value="UK Importer">UK Importer</option>
          <option value="UK Agent / Representative">UK Agent / Representative</option>
          <option value="Amazon Vendor Central UK (1P)">Amazon Vendor Central UK (1P)</option>
          <option value="Marketplace Seller (3P)">Marketplace Seller (3P)</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by verification status"
          className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
        >
          <option value="All">All Verification Statuses</option>
          {(
            [
              'Verified',
              'Partially Verified',
              'Requires Verification',
              'Not Found in Reviewed Sources',
              'Unknown',
            ] as VerificationStatus[]
          ).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">UK Organisation & Contact</th>
                <th className="py-3 px-4">Commercial Role</th>
                <th className="py-3 px-4">Territory</th>
                <th className="py-3 px-4">Relationship Type</th>
                <th className="py-3 px-4">Evidence & Source</th>
                <th className="py-3 px-4">Reviewed</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {filtered.map((rec) => (
                <tr key={rec.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectBrandAndOpen(rec.brandId, 'brand-intelligence')}
                      className="font-semibold text-black dark:text-white hover:text-[#FF6A00] text-left cursor-pointer"
                    >
                      {rec.brandName}
                    </button>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {rec.countryName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 min-w-[200px]">
                    <div className="font-medium text-black dark:text-white">{rec.organisation}</div>
                    <div className="text-[11px] font-mono text-[#FF6A00] mt-0.5">
                      {rec.contactInfo}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {rec.commercialRole}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 min-w-[160px]">
                    {rec.territory}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-black dark:text-white whitespace-nowrap">
                    {rec.relationshipType}
                  </td>
                  <td className="py-3.5 px-4 min-w-[260px]">
                    <div className="text-zinc-700 dark:text-zinc-300">{rec.evidenceSummary}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Source: {rec.sourceName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {rec.dateReviewed}
                  </td>
                  <td className="py-3.5 px-4">
                    <VerificationLabel status={rec.verificationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EvidenceLedger
        records={EVIDENCE_RECORDS.filter(
          (e) => e.entityType === 'distribution' || e.entityType === 'brand'
        )}
        title="Supporting UK Channel Verification Sources"
      />
    </div>
  );
};

/* ============================================================================
 * 10. AMAZON UK RESEARCH (STRICTLY VENDOR CENTRAL UK 1P — ZERO FBA)
 * ========================================================================== */
export const AmazonUkView: React.FC<{
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
}> = ({ onSelectBrandAndOpen }) => {
  const [sellerFilter, setSellerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AMAZON_UK_LISTINGS.filter((item) => {
      const matchesQ =
        !q ||
        item.brandName.toLowerCase().includes(q) ||
        item.productTitle.toLowerCase().includes(q) ||
        item.asin.toLowerCase().includes(q) ||
        item.sellerName.toLowerCase().includes(q);
      const matchesSeller = sellerFilter === 'All' || item.sellerClassification === sellerFilter;
      const matchesStatus = statusFilter === 'All' || item.listingStatus === statusFilter;
      return matchesQ && matchesSeller && matchesStatus;
    });
  }, [sellerFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Amazon Vendor Central UK (1P) Marketplace Intelligence"
        title="Amazon.co.uk 1P vs. 3P Marketplace Audit"
        description="Evaluate Amazon.co.uk Buy Box control, distinguishing official Amazon Vendor Central UK (1P) retail offers from fragmented 3P resellers. Zero FBA—all Mercenta targets route into 1P Vendor Central."
      />

      <PrototypeBannerNote text="Mercenta operates exclusively as an Amazon Vendor Central UK (1P) wholesale partner. Listings held by fragmented 3P resellers represent prime 1P Vendor Central onboarding targets." />

      <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-xs space-y-1.5">
        <div className="font-semibold text-black dark:text-white flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span>How Mercenta Identifies Existing Vendor Central (1P) Accounts: The &ldquo;Sold by Amazon&rdquo; Signal</span>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          When an Amazon.co.uk Buy Box displays <strong className="text-black dark:text-white">&ldquo;Dispatched from and sold by Amazon&rdquo;</strong>, Amazon already purchases stock wholesale directly via a Vendor Central (1P) account. Where listings only show <strong className="text-[#FF6A00]">Third-Party Resellers (3P)</strong> with no &ldquo;Sold by Amazon&rdquo; offer, the producer typically lacks direct 1P Vendor Central stewardship — making them a prime partner for Mercenta&apos;s 1P onboarding pipeline.
        </p>
      </div>

      <MetricStrip
        items={[
          {
            label: 'ASINs Audited on Amazon.co.uk',
            value: String(AMAZON_UK_LISTINGS.length),
            detail: '1P Buy Box & 3P fragmentation checks',
          },
          {
            label: 'Amazon Vendor Central (1P) Active',
            value: String(
              AMAZON_UK_LISTINGS.filter(
                (l) => l.sellerClassification === 'Amazon Vendor Central UK (1P)'
              ).length
            ),
            detail: 'Sold & dispatched by Amazon 1P',
            highlight: true,
          },
          {
            label: '3P / Unverified Reseller Offers',
            value: String(
              AMAZON_UK_LISTINGS.filter(
                (l) =>
                  l.sellerClassification === 'Third-Party Reseller (3P)' ||
                  l.sellerClassification === 'Unverified Marketplace Seller'
              ).length
            ),
            detail: 'Prime Vendor Central 1P conversion targets',
          },
          {
            label: 'A+ & Brand Registry Gaps',
            value: String(
              AMAZON_UK_LISTINGS.filter(
                (l) =>
                  l.listingQualityScore === 'Poor (Duplicate / Incomplete)' ||
                  l.listingQualityScore === 'Moderate (Basic Images)'
              ).length
            ),
            detail: 'Requires Campaign Studio & 1P content cleanup',
          },
        ]}
      />

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, ASIN, product title, seller..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
          />
        </div>
        <select
          value={sellerFilter}
          onChange={(e) => setSellerFilter(e.target.value)}
          aria-label="Filter by seller classification"
          className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
        >
          <option value="All">All Seller Classifications</option>
          <option value="Amazon Vendor Central UK (1P)">Amazon Vendor Central UK (1P)</option>
          <option value="Authorised UK Distributor">Authorised UK Distributor</option>
          <option value="Third-Party Reseller (3P)">Third-Party Reseller (3P)</option>
          <option value="Unverified Marketplace Seller">Unverified Marketplace Seller</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by listing status"
          className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
        >
          <option value="All">All Listing Statuses</option>
          <option value="Active (1P Buy Box)">Active (1P Buy Box)</option>
          <option value="Active (3P Fragmented)">Active (3P Fragmented)</option>
          <option value="Vendor Central Target">Vendor Central Target</option>
          <option value="Suppressed / Incomplete">Suppressed / Incomplete</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 flex flex-col lg:flex-row gap-5"
          >
            <ProductVisual
              src={item.imageUrl}
              alt={item.productTitle}
              className="w-full lg:w-36 h-36 object-contain bg-white dark:bg-zinc-950 p-1.5 shrink-0 border border-zinc-200 dark:border-zinc-800"
            />
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <button
                      type="button"
                      onClick={() => onSelectBrandAndOpen(item.brandId, 'brand-intelligence')}
                      className="font-semibold text-[#FF6A00] hover:underline cursor-pointer"
                    >
                      {item.brandName}
                    </button>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-black dark:text-white">ASIN: {item.asin}</span>
                    <span aria-hidden="true">·</span>
                    <span>Status: {item.listingStatus}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-black dark:text-white mt-1">
                    {item.productTitle}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-bold font-mono tabular-nums text-black dark:text-white">
                    {item.displayedPriceGbp !== null
                      ? `£${item.displayedPriceGbp.toFixed(2)}`
                      : 'Unlisted'}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {item.availability}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                <div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Observed Seller & Channel
                  </div>
                  <div className="font-semibold text-black dark:text-white mt-0.5">
                    {item.sellerName}
                  </div>
                  <div className="text-[11px] text-[#FF6A00]">{item.sellerClassification}</div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Pack Variations
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                    {item.packVariations.join(', ')}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Range Coverage & Listings
                  </div>
                  <div className="font-mono tabular-nums text-black dark:text-white mt-0.5">
                    {item.totalBrandListings} listings · {item.rangeCoveragePct}% range
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Listing Quality
                  </div>
                  <div className="font-medium text-black dark:text-white mt-0.5">
                    {item.listingQualityScore}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                <p className="text-zinc-600 dark:text-zinc-400">{item.brandPresentationNote}</p>
                <VerificationLabel status={item.verificationStatus} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * 11. OPPORTUNITY ASSESSMENT (WITH AI RISK / COMPLIANCE PRE-SCREEN)
 * ========================================================================== */
export const OpportunityAssessmentView: React.FC<{
  selectedBrandId: string;
  brands?: BrandProfile[];
  aiRouting?: AiModelRoutingConfig;
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
}> = ({ selectedBrandId, brands = BRANDS, aiRouting, onSelectBrandAndOpen }) => {
  const initial =
    OPPORTUNITY_ASSESSMENTS.find((o) => o.brandId === selectedBrandId)?.id ||
    OPPORTUNITY_ASSESSMENTS[0].id;
  const [activeId, setActiveId] = useState(initial);
  const [candidateQuery, setCandidateQuery] = useState('');
  const [aiResult, setAiResult] = useState<{
    engineUsed: string;
    summary: string;
    complianceFlags: string[];
    nextSteps: string[];
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  const visibleAssessments = useMemo(() => {
    const q = candidateQuery.trim().toLowerCase();
    if (!q) return OPPORTUNITY_ASSESSMENTS;
    return OPPORTUNITY_ASSESSMENTS.filter(
      (item) =>
        item.brandName.toLowerCase().includes(q) ||
        item.countryName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [candidateQuery]);

  const assessment =
    OPPORTUNITY_ASSESSMENTS.find((o) => o.id === activeId) || OPPORTUNITY_ASSESSMENTS[0];
  const matchedBrand = brands.find((b) => b.id === assessment.brandId) || brands[0];

  const handleRunCompliancePrescreen = async () => {
    setLoadingAi(true);
    setAiErr(null);
    try {
      const res = await fetch('/api/research/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: matchedBrand,
          briefType: 'compliance',
          selectedModelId: aiRouting?.compliance,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run compliance pre-screen.');
      setAiResult(data);
    } catch (err) {
      setAiErr(err instanceof Error ? err.message : 'Unable to reach AI compliance pre-screen.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Commercial Decision Matrix"
        title="Opportunity Assessment & AI Compliance Pre-Screen"
        description="Structured evaluation assessing brand quality, UK distribution evidence, Amazon Vendor Central UK (1P) suitability, and pre-approach regulatory flags."
      />

      <PrototypeBannerNote text="Scoring rubric cross-checks real UK distribution presence against 1P Amazon Vendor Central economics and HMRC excise readiness." />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-black dark:text-white">
              Assessed Brand Candidates ({visibleAssessments.length} / {OPPORTUNITY_ASSESSMENTS.length})
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={candidateQuery}
                onChange={(e) => setCandidateQuery(e.target.value)}
                placeholder="Filter by brand, country, category..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[760px] overflow-y-auto">
            {visibleAssessments.map((item) => {
              const selected = item.id === assessment.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveId(item.id);
                    setAiResult(null);
                    setAiErr(null);
                  }}
                  className={`w-full p-4 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-black'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.brandName}</span>
                    <span className="font-mono font-bold text-sm text-[#FF6A00] tabular-nums">
                      {item.overallScore}/100
                    </span>
                  </div>
                  <div
                    className={`mt-1 text-xs ${
                      selected
                        ? 'text-zinc-300 dark:text-zinc-700'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {item.countryName} · {item.category} · {item.researchCompletenessPct}% researched
                  </div>
                  <div className="mt-2">
                    <OpportunityStatusText status={item.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {assessment.countryName} · {assessment.category} · Assessed {assessment.dateAssessed} by{' '}
                  {assessment.assessedBy}
                </div>
                <h2 className="text-xl font-bold text-black dark:text-white mt-1">
                  {assessment.brandName}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono tabular-nums text-[#FF6A00]">
                  {assessment.overallScore} / 100
                </div>
                <OpportunityStatusText status={assessment.status} />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-black dark:text-white">
                  Evidence-Based Commercial Rationale
                </span>
                <button
                  type="button"
                  onClick={handleRunCompliancePrescreen}
                  disabled={loadingAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{loadingAi ? 'Screening...' : 'Run AI Compliance Pre-Screen'}</span>
                </button>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {assessment.summaryRationale}
              </p>

              {aiErr && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300">
                  {aiErr}
                </div>
              )}

              {aiResult && (
                <div className="p-3.5 bg-white dark:bg-black border border-[#FF6A00]/60 space-y-2">
                  <div className="flex justify-between font-mono text-[11px] text-[#FF6A00]">
                    <span>AI COMPLIANCE & RISK FLAGS</span>
                    <span>{aiResult.engineUsed}</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300">{aiResult.summary}</p>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                    {aiResult.complianceFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <span>
                  <strong className="text-black dark:text-white">Recommended Next Action:</strong>{' '}
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {assessment.recommendedNextAction}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectBrandAndOpen(assessment.brandId, 'brand-intelligence')}
                  className="inline-flex items-center gap-1 font-semibold text-[#FF6A00] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Open Brand Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-black dark:text-white">
                Structured Evaluation Matrix
              </h3>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Research Completeness: {assessment.researchCompletenessPct}%
              </span>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {assessment.criteria.map((c) => (
                <div
                  key={c.criterion}
                  className="px-5 py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="md:col-span-4 font-medium text-black dark:text-white">
                    {c.criterion}
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-900">
                      <div className="h-full bg-[#FF6A00]" style={{ width: `${c.score * 10}%` }} />
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-black dark:text-white w-8 text-right">
                      {c.score}/10
                    </span>
                  </div>
                  <div className="md:col-span-6 text-zinc-600 dark:text-zinc-400">
                    {c.evidenceNote}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 12. SHARED REUSABLE OUTREACH PITCH & AMAZON UK AUDIT DRAWER
 * ========================================================================== */
const OUTREACH_STATUSES: OutreachStatus[] = [
  'Not Contacted',
  'Initial Outreach Sent',
  'Follow-Up Sent',
  'In Active Discussion',
  'Terms Shared',
  'Confirmed',
  'Paused',
];

export const OutreachPitchDrawer: React.FC<{
  brand: BrandProfile;
  distiller?: DistillerManufacturerRecord;
  outreachLog: OutreachLogRecord;
  skus?: ProductSku[];
  aiRouting: AiModelRoutingConfig;
  onUpdateOutreachLog: (record: OutreachLogRecord) => void;
  onClose: () => void;
}> = ({ brand, distiller, outreachLog, skus = PRODUCTS, aiRouting, onUpdateOutreachLog, onClose }) => {
  const brandSkus = skus.filter((s) => s.brandId === brand.id);
  const primarySku = brandSkus[0];
  const amazonListing = AMAZON_UK_LISTINGS.find((a) => a.brandId === brand.id);
  const ukDistribution = UK_DISTRIBUTION_RECORDS.find((u) => u.brandId === brand.id);
  const opportunityAssessment = OPPORTUNITY_ASSESSMENTS.find((o) => o.brandId === brand.id);
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

  const [pitchTone, setPitchTone] = useState<string>('First Commercial Outreach');
  const [pitchSubject, setPitchSubject] = useState<string>(outreachLog.lastPitchSubject || '');
  const [pitchBody, setPitchBody] = useState<string>(outreachLog.lastPitchBody || '');
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [amazonAudit, setAmazonAudit] = useState<OutreachAmazonAudit | null>(
    outreachLog.lastAmazonAudit || null
  );
  const [pitchEngine, setPitchEngine] = useState<string>('');
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isTargetNoSoldByAmazon = brand.amazonUkPresence.includes("No 'Sold by Amazon'");

  const handleGenerateAiPitch = async () => {
    setPitchLoading(true);
    setPitchError(null);
    try {
      const res = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          distillerContact: distiller,
          outreachLog,
          amazonListing,
          ukDistribution,
          opportunityAssessment,
          mutualBenefit,
          skus: brandSkus,
          pitchType: pitchTone,
          selectedModelId: aiRouting.outreach,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to draft outreach pitch.');
      setPitchSubject(String(data.subject || ''));
      setPitchBody(String(data.emailBody || ''));
      setTalkingPoints(Array.isArray(data.talkingPoints) ? data.talkingPoints : []);
      if (data.amazonUkAudit && typeof data.amazonUkAudit === 'object') {
        setAmazonAudit(data.amazonUkAudit as OutreachAmazonAudit);
      }
      setPitchEngine(String(data.engineUsed || aiRouting.outreach));
    } catch (err) {
      setPitchError(err instanceof Error ? err.message : 'Unable to generate AI outreach email.');
    } finally {
      setPitchLoading(false);
    }
  };

  const handleCopyPitch = async () => {
    const text = `Subject: ${pitchSubject}\n\n${pitchBody}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const handleLogAsSent = () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextDateObj = new Date();
    nextDateObj.setDate(nextDateObj.getDate() + 5);
    const nextIso = nextDateObj.toISOString().slice(0, 10);

    onUpdateOutreachLog({
      ...outreachLog,
      outreachStatus:
        outreachLog.outreachStatus === 'Not Contacted'
          ? 'Initial Outreach Sent'
          : outreachLog.outreachStatus === 'Initial Outreach Sent'
          ? 'Follow-Up Sent'
          : outreachLog.outreachStatus,
      lastContacted: today,
      nextFollowUp: nextIso,
      lastPitchSubject: pitchSubject || outreachLog.lastPitchSubject,
      lastPitchBody: pitchBody || outreachLog.lastPitchBody,
      lastAmazonAudit: amazonAudit || outreachLog.lastAmazonAudit,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0B0B0D] h-full overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 p-6 space-y-5 text-xs">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-3.5 min-w-0">
            <ProductVisual
              src={primarySku?.imageUrl || amazonListing?.imageUrl || ''}
              alt={brand.name}
              className="w-16 h-20 object-contain bg-white dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[11px] font-mono text-[#FF6A00]">
                TAILORED 1P PITCH & AMAZON UK AUDIT
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mt-0.5 truncate">
                {brand.name} ({brand.countryName})
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400">
                UK Distributor: {distiller?.ukDistributorName || brand.ukImporterOrDistributor}
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <span
                  className={`w-1.5 h-1.5 ${
                    isTargetNoSoldByAmazon ? 'bg-[#FF6A00]' : 'bg-emerald-500'
                  }`}
                />
                <span className={isTargetNoSoldByAmazon ? 'text-[#FF6A00] font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                  {brand.amazonUkPresence}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer shrink-0"
            aria-label="Close outreach drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Baseline Amazon.co.uk Data & Opportunity Audit Brief */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-black dark:text-white">
              Amazon.co.uk Brand Audit & 1P Commercial Opportunity Brief
            </span>
            <span className="font-mono text-[11px] text-[#FF6A00] font-semibold">
              {amazonAudit?.estimatedAnnual1pUpsideGbp ||
                `Est. £${brand.illustrativePipelineValueGbp.toLocaleString()} / yr 1P PO Potential`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="p-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500">Buy Box Signal</div>
              <div className="font-semibold text-black dark:text-white mt-0.5">
                {amazonAudit?.buyBoxSignal ||
                  (amazonListing
                    ? `${amazonListing.listingStatus} · ASIN ${amazonListing.asin}`
                    : brand.amazonUkPresence)}
              </div>
            </div>
            <div className="p-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500">3P Leakage / Pricing</div>
              <div className="font-semibold text-black dark:text-white mt-0.5">
                {amazonAudit?.resellerLeakageRisk ||
                  (amazonListing
                    ? `${amazonListing.sellerClassification} (${
                        amazonListing.displayedPriceGbp !== null
                          ? `£${amazonListing.displayedPriceGbp.toFixed(2)}`
                          : 'Unlisted'
                      }${primarySku ? ` vs RRP £${primarySku.illustrativeRrpGbp.toFixed(2)}` : ''})`
                    : brand.ukArrangementType)}
              </div>
            </div>
            <div className="p-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500">Content & Range Gap</div>
              <div className="font-semibold text-black dark:text-white mt-0.5">
                {amazonAudit?.listingQualityGap ||
                  (amazonListing
                    ? `${amazonListing.listingQualityScore} (${amazonListing.rangeCoveragePct}% range)`
                    : 'A+ Content & Brand Store Unclaimed')}
              </div>
            </div>
          </div>

          {amazonAudit?.keyOpportunities && amazonAudit.keyOpportunities.length > 0 && (
            <div className="pt-1">
              <div className="text-[11px] font-mono text-[#FF6A00] mb-1">
                CONCRETE 1P PARTNERSHIP OPPORTUNITIES TO SHOWCASE TO {brand.name.toUpperCase()}
              </div>
              <ul className="list-disc pl-4 space-y-1 text-zinc-700 dark:text-zinc-300">
                {amazonAudit.keyOpportunities.map((opp, idx) => (
                  <li key={idx}>{opp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantified Two-Way Mutual Value Breakdown */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold text-[#FF6A00]">
                TWO-WAY MUTUAL VALUE · OBJECTIVE FIT {mutualBenefit.objectiveFitScore}/100
              </span>
              <span className="font-mono tabular-nums text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                1P Spread: £{mutualBenefit.wholesaleMarginPerUnitGbp.toFixed(2)}/unit ({mutualBenefit.wholesaleMarginPct}%)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="font-semibold text-black dark:text-white">
                  What {brand.name} Wins
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {mutualBenefit.brandGains.priceIntegrityRecovery}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {mutualBenefit.brandGains.distributorCoexistence}
                </p>
              </div>
              <div className="p-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="font-semibold text-black dark:text-white">
                  What Mercenta Wins (1P)
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {mutualBenefit.mercentaGains.marginSpreadSummary}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Route: {mutualBenefit.recommendedLogisticsPathway}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Status Editor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Outreach Status</label>
            <select
              value={outreachLog.outreachStatus}
              onChange={(e) =>
                onUpdateOutreachLog({
                  ...outreachLog,
                  outreachStatus: e.target.value as OutreachStatus,
                })
              }
              className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-semibold"
            >
              {OUTREACH_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Contact Person</label>
            <input
              type="text"
              value={outreachLog.contactPerson}
              onChange={(e) =>
                onUpdateOutreachLog({ ...outreachLog, contactPerson: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Contact Email</label>
            <input
              type="email"
              value={outreachLog.contactEmail}
              onChange={(e) =>
                onUpdateOutreachLog({ ...outreachLog, contactEmail: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Next Follow-Up Date</label>
            <input
              type="date"
              value={outreachLog.nextFollowUp}
              onChange={(e) =>
                onUpdateOutreachLog({ ...outreachLog, nextFollowUp: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] text-zinc-500 mb-1">
              Discussion Notes & Next Actions
            </label>
            <textarea
              rows={2}
              value={outreachLog.discussionNotes}
              onChange={(e) =>
                onUpdateOutreachLog({ ...outreachLog, discussionNotes: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
            />
          </div>
        </div>

        {/* AI Pitch Email Generator */}
        <div className="space-y-3 border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-black dark:text-white">
                AI Commercial Outreach & Amazon UK Data Pitch Drafter
              </div>
              <div className="text-[11px] text-zinc-500">
                Active Outreach AI: <span className="font-mono text-[#FF6A00]">{aiRouting.outreach}</span>
              </div>
            </div>
            <select
              value={pitchTone}
              onChange={(e) => setPitchTone(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
            >
              <option value="First Commercial Outreach">First Cold Intro (Vendor Central 1P + UK Audit)</option>
              <option value="Follow-Up After Initial Intro">Polite 5-Day Follow-Up</option>
              <option value="Vendor Central 1P + DHL Credit Terms Pitch">
                Vendor Central 1P + DHL Credit Direct-Ship Proposal
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerateAiPitch}
            disabled={pitchLoading}
            className="w-full py-2.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {pitchLoading
                ? 'Auditing Amazon.co.uk Data & Drafting Tailored 1P Pitch...'
                : 'Generate Tailored AI Pitch + Amazon.co.uk Brand Audit'}
            </span>
          </button>

          {pitchError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300">
              {pitchError}
            </div>
          )}

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Email Subject</label>
            <input
              type="text"
              value={pitchSubject}
              onChange={(e) => setPitchSubject(e.target.value)}
              placeholder="Generated email subject line..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Email Body</label>
            <textarea
              rows={9}
              value={pitchBody}
              onChange={(e) => setPitchBody(e.target.value)}
              placeholder="Click Generate Tailored AI Pitch to produce a personalized Vendor Central UK (1P) proposal grounded in Amazon.co.uk Buy Box data..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white leading-relaxed"
            />
          </div>

          {talkingPoints.length > 0 && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-[11px] font-mono text-[#FF6A00]">
                KEY COMMERCIAL TALKING POINTS ({pitchEngine})
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 dark:text-zinc-300">
                {talkingPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopyPitch}
              disabled={!pitchBody}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-300 dark:border-zinc-700 font-medium disabled:opacity-40 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Email'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogAsSent}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save & Log Outreach Sent Today</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 12B. 1P PITCH TARGETS (BRANDS WITHOUT "SOLD BY AMAZON")
 * ========================================================================== */
export const OnePPitchTargetsView: React.FC<{
  brands?: BrandProfile[];
  distillers?: DistillerManufacturerRecord[];
  skus?: ProductSku[];
  outreachLogs: Record<string, OutreachLogRecord>;
  onUpdateOutreachLog: (record: OutreachLogRecord) => void;
  onAddDiscoveredBrand?: (payload: {
    brand: BrandProfile;
    distiller: DistillerManufacturerRecord;
    sku: ProductSku;
  }) => void;
  aiRouting: AiModelRoutingConfig;
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
}> = ({
  brands = BRANDS,
  distillers = DISTILLER_DIRECTORY,
  skus = PRODUCTS,
  outreachLogs,
  onUpdateOutreachLog,
  onAddDiscoveredBrand,
  aiRouting,
  onSelectBrandAndOpen,
}) => {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | DrinkCategory>('All');
  const [outreachFilter, setOutreachFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'fitScore' | 'marginPct' | 'pipelineValue' | 'driftPct'>('fitScore');
  const [drawerBrandId, setDrawerBrandId] = useState<string | null>(null);
  const [scoutOpen, setScoutOpen] = useState(false);

  const targetBrands = useMemo(
    () => brands.filter((b) => b.amazonUkPresence.includes("No 'Sold by Amazon'")),
    [brands]
  );

  const rankedTargets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = targetBrands
      .filter((b) => {
        const log = outreachLogs[b.id];
        const currentOutreach = log?.outreachStatus || 'Not Contacted';
        const matchesQ =
          !q ||
          b.name.toLowerCase().includes(q) ||
          b.countryName.toLowerCase().includes(q) ||
          b.manufacturer.toLowerCase().includes(q) ||
          b.ukImporterOrDistributor.toLowerCase().includes(q);
        const matchesCountry = countryFilter === 'All' || b.countryId === countryFilter;
        const matchesCategory =
          categoryFilter === 'All' ||
          b.primaryCategory === categoryFilter ||
          b.categories.includes(categoryFilter);
        const matchesOutreach = outreachFilter === 'All' || currentOutreach === outreachFilter;
        return matchesQ && matchesCountry && matchesCategory && matchesOutreach;
      })
      .map((brand) => ({
        brand,
        mutual: computeMutualBenefitAnalysis(
          brand,
          skus,
          AMAZON_UK_LISTINGS,
          UK_DISTRIBUTION_RECORDS,
          OPPORTUNITY_ASSESSMENTS
        ),
      }));

    return list.sort((a, b) => {
      if (sortBy === 'marginPct') {
        return b.mutual.wholesaleMarginPct - a.mutual.wholesaleMarginPct;
      }
      if (sortBy === 'pipelineValue') {
        return b.mutual.estimatedAnnual1pPoGbp - a.mutual.estimatedAnnual1pPoGbp;
      }
      if (sortBy === 'driftPct') {
        return Math.abs(b.mutual.pricingDriftPct) - Math.abs(a.mutual.pricingDriftPct);
      }
      return b.mutual.objectiveFitScore - a.mutual.objectiveFitScore;
    });
  }, [targetBrands, outreachLogs, search, countryFilter, categoryFilter, outreachFilter, sortBy, skus]);

  const highFitTargetsCount = useMemo(
    () =>
      targetBrands.filter(
        (b) =>
          computeMutualBenefitAnalysis(
            b,
            skus,
            AMAZON_UK_LISTINGS,
            UK_DISTRIBUTION_RECORDS,
            OPPORTUNITY_ASSESSMENTS
          ).objectiveFitScore >= 75
      ).length,
    [targetBrands, skus]
  );
  const uncontactedCount = targetBrands.filter(
    (b) => !outreachLogs[b.id] || outreachLogs[b.id].outreachStatus === 'Not Contacted'
  ).length;
  const totalPipelineGbp = targetBrands.reduce(
    (sum, b) => sum + b.illustrativePipelineValueGbp,
    0
  );

  const drawerBrand = brands.find((b) => b.id === drawerBrandId) || null;
  const drawerDistiller = drawerBrand
    ? distillers.find((d) => d.brandId === drawerBrand.id)
    : undefined;
  const drawerLog: OutreachLogRecord | null = drawerBrand
    ? outreachLogs[drawerBrand.id] || {
        brandId: drawerBrand.id,
        outreachStatus: 'Not Contacted',
        contactPerson: drawerDistiller?.exportContactRole || 'Export Director',
        contactRole: drawerDistiller?.exportContactRole || 'Export & UK Commercial',
        contactEmail: drawerDistiller?.exportContactEmail || `exports@${drawerBrand.website}`,
        lastContacted: 'Not yet contacted',
        nextFollowUp: new Date().toISOString().slice(0, 10),
        discussionNotes: '',
      }
    : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Unbiased 1P Partner Queue · No 'Sold by Amazon' Signal"
        title="1P Pitch Targets (Objective Mutual Fit Ranking)"
        description="Candidates lacking a 'Sold by Amazon' 1P Buy Box are scored and ranked purely on objective UK market signals—3P pricing erosion, 1P wholesale-to-RRP margin spread, A+ content gaps, and mutual commercial upside."
        actions={
          <button
            type="button"
            onClick={() => setScoutOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>AI Market Scout (Unbiased)</span>
          </button>
        }
      />

      <div className="border border-[#FF6A00]/40 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-black dark:text-white">
          <ShieldAlert className="w-4 h-4 text-[#FF6A00] shrink-0" />
          <span>
            How Mercenta Scores &amp; Discovers Mutual-Benefit 1P Partners Without Brand Bias
          </span>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Every producer lacking <strong className="text-black dark:text-white">&ldquo;Dispatched from and sold by Amazon&rdquo;</strong> is ranked dynamically using the same 100-point rubric: <strong className="text-black dark:text-white">Brand Gains</strong> (recovering Buy Box pricing discipline from 3P leakage, Brand Registry &amp; A+ conversion, and zero-FBA direct 1P POs) paired with <strong className="text-[#FF6A00]">Mercenta Gains</strong> (1P wholesale-to-RRP margin headroom, repeat PO volume, and HMRC excise/WePrep efficiency). Use <strong className="text-black dark:text-white">AI Market Scout</strong> to discover untapped global producers by region or category gap.
        </p>
      </div>

      <MetricStrip
        items={[
          {
            label: 'Total 1P Pitch Targets',
            value: String(targetBrands.length),
            detail: 'Brands lacking "Sold by Amazon" Buy Box',
            highlight: true,
          },
          {
            label: 'Prime Objective Fit (75+)',
            value: String(highFitTargetsCount),
            detail: 'Highest two-way mutual benefit candidates',
          },
          {
            label: 'Ready for First Outreach',
            value: String(uncontactedCount),
            detail: 'Not yet pitched on 1P terms',
          },
          {
            label: 'Est. Target 1P Pipeline',
            value: `£${(totalPipelineGbp / 1000000).toFixed(2)}M`,
            detail: 'Combined annual UK wholesale opportunity',
            highlight: true,
          },
        ]}
      />

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any brand, producer, country, UK importer..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
          />
        </div>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          aria-label="Filter pitch targets by country"
          className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
        >
          <option value="All">All Countries ({COUNTRIES.length})</option>
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'All' | DrinkCategory)}
          aria-label="Filter pitch targets by category"
          className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
        >
          <option value="All">All Drink Categories</option>
          {ALL_DRINK_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={outreachFilter}
          onChange={(e) => setOutreachFilter(e.target.value)}
          aria-label="Filter pitch targets by outreach status"
          className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
        >
          <option value="All">All Outreach Stages</option>
          {OUTREACH_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'fitScore' | 'marginPct' | 'pipelineValue' | 'driftPct')}
          aria-label="Sort pitch targets objectively"
          className="px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
        >
          <option value="fitScore">Sort: Objective Partner Fit Score</option>
          <option value="marginPct">Sort: 1P Margin Spread (%)</option>
          <option value="pipelineValue">Sort: Est. Annual 1P POs (£)</option>
          <option value="driftPct">Sort: 3P Price Drift Urgency</option>
        </select>
      </div>

      <div className="space-y-4">
        {rankedTargets.map(({ brand, mutual }, rankIdx) => {
          const primarySku = skus.find((s) => s.brandId === brand.id);
          const amz = AMAZON_UK_LISTINGS.find((a) => a.brandId === brand.id);
          const dist = distillers.find((d) => d.brandId === brand.id);
          const log = outreachLogs[brand.id];
          const outreachStatus = log?.outreachStatus || 'Not Contacted';

          return (
            <div
              key={brand.id}
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 flex flex-col lg:flex-row gap-5 items-start"
            >
              <ProductVisual
                src={primarySku?.imageUrl || amz?.imageUrl || ''}
                alt={brand.name}
                className="w-full lg:w-32 h-36 object-contain bg-white dark:bg-zinc-950 p-1.5 shrink-0 border border-zinc-200 dark:border-zinc-800"
              />
              <div className="flex-1 min-w-0 space-y-3 w-full">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-[#FF6A00] tabular-nums">
                        #{rankIdx + 1} · FIT {mutual.objectiveFitScore}/100 ({mutual.fitTier})
                      </span>
                      <span className="text-zinc-400">·</span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {brand.countryName} ({brand.region})
                      </span>
                      <span className="text-zinc-400">·</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{brand.primaryCategory}</span>
                    </div>
                    <h3 className="text-base font-bold text-black dark:text-white mt-0.5">
                      {brand.name}
                    </h3>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Producer: {brand.manufacturer}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectBrandAndOpen(brand.id, 'brand-intelligence')}
                      className="px-3 py-2 text-xs font-medium border border-zinc-300 dark:border-zinc-700 text-black dark:text-white hover:border-[#FF6A00] cursor-pointer"
                    >
                      Inspect Dossier &amp; Radar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerBrandId(brand.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Draft Win-Win 1P Pitch</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                  <div>
                    <div className="text-[11px] text-zinc-500">Observed Amazon UK Status</div>
                    <div className="font-semibold text-black dark:text-white mt-0.5">
                      {amz ? `${amz.sellerName} (ASIN ${amz.asin})` : brand.amazonUkPresence}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-zinc-500">
                      {amz?.displayedPriceGbp !== null && amz?.displayedPriceGbp !== undefined
                        ? `3P £${amz.displayedPriceGbp.toFixed(2)}`
                        : 'Unlisted'}
                      {primarySku ? ` vs RRP £${primarySku.illustrativeRrpGbp.toFixed(2)}` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">UK Distributor &amp; Outreach</div>
                    <div className="font-medium text-black dark:text-white mt-0.5 truncate">
                      {dist?.ukDistributorName || brand.ukImporterOrDistributor}
                    </div>
                    <div className="text-[11px] font-mono text-[#FF6A00] truncate">
                      {outreachStatus} · {log?.contactEmail || dist?.exportContactEmail || `exports@${brand.website}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">What {brand.name} Wins</div>
                    <div className="text-zinc-700 dark:text-zinc-300 mt-0.5 line-clamp-2">
                      {mutual.brandGains.priceIntegrityRecovery}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">What Mercenta Wins (1P)</div>
                    <div className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      £{mutual.wholesaleMarginPerUnitGbp.toFixed(2)}/unit ({mutual.wholesaleMarginPct}%) · £
                      {mutual.estimatedAnnual1pPoGbp.toLocaleString()}/yr
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {mutual.recommendedLogisticsPathway}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {drawerBrand && drawerLog && (
        <OutreachPitchDrawer
          brand={drawerBrand}
          distiller={drawerDistiller}
          outreachLog={drawerLog}
          skus={skus}
          aiRouting={aiRouting}
          onUpdateOutreachLog={onUpdateOutreachLog}
          onClose={() => setDrawerBrandId(null)}
        />
      )}

      {scoutOpen && (
        <AiMarketScoutModal
          brands={brands}
          countries={COUNTRIES}
          onAddDiscoveredBrand={onAddDiscoveredBrand}
          onSelectBrandAndOpen={onSelectBrandAndOpen}
          onClose={() => setScoutOpen(false)}
        />
      )}
    </div>
  );
};

/* ============================================================================
 * 13. ACQUISITION PIPELINE + OUTREACH & DISCUSSION TRACKER + AI PITCH DRAWER
 * ========================================================================== */
export const AcquisitionPipelineView: React.FC<{
  brands?: BrandProfile[];
  distillers?: DistillerManufacturerRecord[];
  skus?: ProductSku[];
  outreachLogs: Record<string, OutreachLogRecord>;
  onUpdateOutreachLog: (record: OutreachLogRecord) => void;
  aiRouting: AiModelRoutingConfig;
  onSelectBrandAndOpen: (brandId: string, target?: NavSectionId) => void;
}> = ({
  brands = BRANDS,
  distillers = DISTILLER_DIRECTORY,
  skus = PRODUCTS,
  outreachLogs,
  onUpdateOutreachLog,
  aiRouting,
  onSelectBrandAndOpen,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [outreachFilter, setOutreachFilter] = useState<string>('All');
  const [drawerBrandId, setDrawerBrandId] = useState<string | null>(null);

  const visibleStages =
    stageFilter === 'All' ? PIPELINE_STAGES : PIPELINE_STAGES.filter((s) => s === stageFilter);

  const filteredBrands = brands.filter((b) => {
    const matchesStage = stageFilter === 'All' || b.pipelineStage === stageFilter;
    const log = outreachLogs[b.id];
    const currentStatus = log?.outreachStatus || 'Not Contacted';
    const matchesOutreach = outreachFilter === 'All' || currentStatus === outreachFilter;
    return matchesStage && matchesOutreach;
  });

  const drawerBrand = brands.find((b) => b.id === drawerBrandId) || null;
  const drawerDistiller = drawerBrand
    ? distillers.find((d) => d.brandId === drawerBrand.id)
    : undefined;
  const drawerLog: OutreachLogRecord | null = drawerBrand
    ? outreachLogs[drawerBrand.id] || {
        brandId: drawerBrand.id,
        outreachStatus: 'Not Contacted',
        contactPerson: drawerDistiller?.exportContactRole || 'Export Director',
        contactRole: drawerDistiller?.exportContactRole || 'Export & UK Commercial',
        contactEmail: drawerDistiller?.exportContactEmail || `exports@${drawerBrand.website}`,
        lastContacted: 'Not yet contacted',
        nextFollowUp: new Date().toISOString().slice(0, 10),
        discussionNotes: '',
      }
    : null;

  const contactedCount = Object.values(outreachLogs).filter(
    (l) => l.outreachStatus !== 'Not Contacted' && l.outreachStatus !== 'Paused'
  ).length;
  const activeDiscussionsCount = Object.values(outreachLogs).filter(
    (l) =>
      l.outreachStatus === 'In Active Discussion' ||
      l.outreachStatus === 'Terms Shared' ||
      l.outreachStatus === 'Confirmed'
  ).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Partner Evaluation & Outreach CRM"
        title="Brand Acquisition Pipeline & Discussion Tracker"
        description="Track every brand contacted, discussion stage, next follow-up date, and draft tailored Amazon Vendor Central UK (1P) + Mercenta DHL Credit pitches using your configured low-cost AI outreach engine."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={outreachFilter}
              onChange={(e) => setOutreachFilter(e.target.value)}
              aria-label="Filter outreach status"
              className="px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
            >
              <option value="All">All Outreach Statuses</option>
              {OUTREACH_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              aria-label="Filter pipeline stage"
              className="px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
            >
              <option value="All">All 11 Pipeline Stages</option>
              {PIPELINE_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <div className="flex border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Outreach Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-black text-black dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Stage Board</span>
              </button>
            </div>
          </div>
        }
      />

      <MetricStrip
        items={[
          {
            label: 'Brands Contacted',
            value: `${contactedCount} / ${brands.length}`,
            detail: 'Outreach sent or ongoing discussion',
            highlight: true,
          },
          {
            label: 'In Active Discussion / Terms',
            value: String(activeDiscussionsCount),
            detail: 'Active commercial negotiation',
          },
          {
            label: 'Outreach AI Engine',
            value: aiRouting.outreach,
            detail: 'Configurable in Admin AI Cost Router',
          },
          {
            label: 'Target Amazon Model',
            value: 'Vendor Central 1P',
            detail: 'DHL Credit + WePrep / Wet-Bond',
            highlight: true,
          },
        ]}
      />

      {viewMode === 'board' ? (
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-4 min-w-max">
            {visibleStages.map((stage, idx) => {
              const stageBrands = filteredBrands.filter((b) => b.pipelineStage === stage);
              return (
                <div
                  key={stage}
                  className="w-[270px] shrink-0 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col"
                >
                  <div className="px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono text-[#FF6A00] mr-1.5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-semibold text-black dark:text-white truncate">
                        {stage}
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                      {stageBrands.length}
                    </span>
                  </div>

                  <div className="p-3 space-y-3 min-h-[220px]">
                    {stageBrands.length === 0 ? (
                      <div className="text-[11px] text-zinc-400 dark:text-zinc-600 py-8 text-center">
                        No brands currently in stage
                      </div>
                    ) : (
                      stageBrands.map((brand) => {
                        const log = outreachLogs[brand.id];
                        return (
                          <div
                            key={brand.id}
                            className="w-full p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => onSelectBrandAndOpen(brand.id, 'brand-intelligence')}
                                className="font-bold text-black dark:text-white hover:text-[#FF6A00] text-left cursor-pointer"
                              >
                                {brand.name}
                              </button>
                              <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                                £{Math.round(brand.illustrativePipelineValueGbp / 1000)}k
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-[#FF6A00]">
                              {log?.outreachStatus || 'Not Contacted'}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                              {log?.discussionNotes || brand.nextAction}
                            </div>
                            <button
                              type="button"
                              onClick={() => setDrawerBrandId(brand.id)}
                              className="w-full py-1.5 text-[11px] font-semibold border border-zinc-200 dark:border-zinc-800 hover:border-[#FF6A00] text-black dark:text-white cursor-pointer"
                            >
                              Update Log / Draft AI Pitch
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                <th className="py-3 px-4">Brand & Origin</th>
                <th className="py-3 px-4">Outreach Status</th>
                <th className="py-3 px-4">Contact Person & Email</th>
                <th className="py-3 px-4">Last Contact / Follow-Up</th>
                <th className="py-3 px-4">Discussion Progress Notes</th>
                <th className="py-3 px-4 text-right">Outreach & AI Pitch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {filteredBrands.map((brand) => {
                const log = outreachLogs[brand.id];
                const st = log?.outreachStatus || 'Not Contacted';
                return (
                  <tr key={brand.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectBrandAndOpen(brand.id, 'brand-intelligence')}
                        className="font-semibold text-black dark:text-white hover:text-[#FF6A00] text-left cursor-pointer"
                      >
                        {brand.name}
                      </button>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {brand.countryName} · {brand.pipelineStage}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          st === 'Confirmed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : st === 'In Active Discussion' || st === 'Terms Shared'
                            ? 'text-[#FF6A00]'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {st}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-medium text-black dark:text-white">
                        {log?.contactPerson || 'Export Director'}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        {log?.contactEmail || `info@${brand.website}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                      <div className="text-black dark:text-white">
                        Last: {log?.lastContacted || '—'}
                      </div>
                      <div className="text-[#FF6A00]">Next: {log?.nextFollowUp || 'TBD'}</div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[260px] text-zinc-600 dark:text-zinc-300">
                      {log?.discussionNotes || brand.nextAction}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDrawerBrandId(brand.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white font-semibold cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Manage / AI Pitch</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {drawerBrand && drawerLog && (
        <OutreachPitchDrawer
          brand={drawerBrand}
          distiller={drawerDistiller}
          outreachLog={drawerLog}
          skus={skus}
          aiRouting={aiRouting}
          onUpdateOutreachLog={onUpdateOutreachLog}
          onClose={() => setDrawerBrandId(null)}
        />
      )}
    </div>
  );
};
