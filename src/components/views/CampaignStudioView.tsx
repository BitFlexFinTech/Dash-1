import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookmarkPlus,
  CheckCircle2,
  Lock,
  Monitor,
  Play,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  AI_MODEL_CATALOG,
  AMAZON_AD_CHANNELS,
  AMAZON_AD_FORMATS,
  BRANDS,
  CAMPAIGNS,
} from '../../data/bwsData';
import {
  AiModelRoutingConfig,
  AmazonAdChannelId,
  AmazonAdFormatId,
  BrandProfile,
  CampaignDraft,
  ProductSku,
} from '../../types/bws';
import { ProductVisual, PrototypeBannerNote, SectionHeader } from '../ui/SharedPrimitives';

const PROHIBITED_CAP_PATTERNS: { term: string; reason: string }[] = [
  { term: '#1', reason: 'Unsubstantiated superiority (#1 claim) violates UK CAP/ASA rules' },
  { term: 'best in the world', reason: 'Unsubstantiated superlative claim' },
  { term: 'confidence', reason: 'ASA CAP 18.3 bans implying alcohol enhances social confidence' },
  { term: 'popular', reason: 'ASA CAP 18.3 prohibits linking drinking to popularity' },
  { term: 'sexual', reason: 'ASA CAP 18.5 strictly prohibits sexual/romantic attraction claims' },
  { term: 'sexy', reason: 'ASA CAP 18.5 strictly prohibits sexualised imagery/copy' },
  { term: 'romantic', reason: 'ASA CAP 18.5 bans linking alcohol to romantic success' },
  { term: 'athlete', reason: 'ASA CAP 18.6 bans linking alcohol to athletic or physical performance' },
  { term: 'workout', reason: 'ASA CAP 18.6 bans fitness/sport performance associations' },
  { term: 'health', reason: 'ASA CAP 18.7 prohibits health, therapeutic, or medicinal claims' },
  { term: 'cure', reason: 'ASA CAP 18.7 strictly forbids medical/therapeutic claims' },
  { term: 'drive', reason: 'ASA CAP 18.12 forbids associating alcohol with driving or machinery' },
  { term: 'binge', reason: 'ASA CAP 18.1 prohibits encouraging excessive or irresponsible drinking' },
  { term: 'drunk', reason: 'ASA CAP 18.1 prohibits depicting or encouraging intoxication' },
  { term: 'teen', reason: 'ASA CAP 18.14 strictly prohibits appealing to under-18 audiences' },
  { term: 'student', reason: 'High risk under CAP 18.14 youth appeal & binge-drinking enforcement' },
];

export const CampaignStudioView: React.FC<{
  brands?: BrandProfile[];
  skus: ProductSku[];
  aiRouting: AiModelRoutingConfig;
  campaignDrafts: CampaignDraft[];
  onSaveDraft: (draft: CampaignDraft) => void;
}> = ({ brands = BRANDS, skus, aiRouting, campaignDrafts, onSaveDraft }) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id || BRANDS[0].id);
  const [selectedSkuId, setSelectedSkuId] = useState<string>(skus[0]?.id || 'sku-glen-12');
  const [channelId, setChannelId] = useState<AmazonAdChannelId>('amazon_store');
  const [formatId, setFormatId] = useState<AmazonAdFormatId>('sb_collection');
  const [objective, setObjective] = useState('Vendor Central UK (1P) Retail Conversion & Gifting');
  const [toneNote, setToneNote] = useState(
    'Authentic distillery craftsmanship, cask heritage & refined serve provenance'
  );
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [recSize, setRecSize] = useState<'300x250' | '728x90' | '300x600'>('300x250');

  const brand = brands.find((b) => b.id === selectedBrandId) || brands[0];
  const brandSkus = useMemo(() => {
    const matches = skus.filter((s) => s.brandId === brand.id);
    return matches.length > 0 ? matches : skus.slice(0, 2);
  }, [skus, brand.id]);

  const activeSku =
    brandSkus.find((s) => s.id === selectedSkuId) || brandSkus[0] || skus[0];
  const competitorSkus = useMemo(
    () => skus.filter((s) => s.brandId !== brand.id).slice(0, 6),
    [skus, brand.id]
  );

  const activeChannel =
    AMAZON_AD_CHANNELS.find((c) => c.id === channelId) || AMAZON_AD_CHANNELS[0];
  const activeFormat =
    AMAZON_AD_FORMATS.find((f) => f.id === formatId) || AMAZON_AD_FORMATS[1];

  const [headline, setHeadline] = useState(
    `${brand.name} — ${brand.region} Provenance`
  );
  const [subheadline, setSubheadline] = useState(
    `18+ UK Vendor Central 1P Official Store · ${activeSku?.abv || '40%'} ABV`
  );
  const [bodyCopy, setBodyCopy] = useState(
    `${activeSku?.tastingNotes || brand.description}`.slice(0, 95)
  );
  const [audioScript, setAudioScript] = useState(
    `Discover ${brand.name} from ${brand.region}, ${brand.countryName}. Crafted in small batches at ${activeSku?.abv || '40%'} ABV. Explore the official UK range on Amazon. Enjoy responsibly. 18+ only.`
  );
  const [ctaLabel, setCtaLabel] = useState('Shop now');
  const [targetKeywords, setTargetKeywords] = useState<string[]>([
    `${brand.primaryCategory.toLowerCase()} gift uk`,
    `${brand.name.toLowerCase()} 700ml`,
    `craft ${brand.countryName.toLowerCase()} drinks`,
    'luxury spirits hampers 18+',
  ]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([
    'kids',
    'teen party',
    'student cheap',
    'binge drinking games',
  ]);
  const [ratingExclusions, setRatingExclusions] = useState<string[]>([
    'NR',
    'TV-Y',
    'TV-Y7',
    'G / UK U',
    'PG / UK PG',
  ]);
  const [visualBrief, setVisualBrief] = useState(
    'Architectural packshot lighting on slate or oak tasting table; any hand or lifestyle talent must be and appear 25+ years old.'
  );
  const [modelAge25Confirmed, setModelAge25Confirmed] = useState(true);
  const [includeResponsibleFooter, setIncludeResponsibleFooter] = useState(true);
  const [engineUsedLabel, setEngineUsedLabel] = useState(
    'gemini-4-hydrogen (Built-in Build Lock)'
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const selectedImageModel =
    AI_MODEL_CATALOG.find((m) => m.id === aiRouting.campaignImage)?.name || aiRouting.campaignImage;
  const selectedVideoModel =
    AI_MODEL_CATALOG.find((m) => m.id === aiRouting.campaignVideo)?.name || aiRouting.campaignVideo;

  const handleBrandChange = (nextBrandId: string) => {
    setSelectedBrandId(nextBrandId);
    const nextBrand = brands.find((b) => b.id === nextBrandId) || brands[0];
    const nextBrandSkus = skus.filter((s) => s.brandId === nextBrandId);
    const firstSku = nextBrandSkus[0] || skus[0];
    if (firstSku) {
      setSelectedSkuId(firstSku.id);
      setHeadline(`${nextBrand.name} — ${nextBrand.region} Craftsmanship`);
      setSubheadline(`Amazon Vendor Central UK (1P) · ${firstSku.abv} ABV · ${firstSku.bottleSize}`);
      setBodyCopy((firstSku.tastingNotes || nextBrand.description).slice(0, activeFormat.maxBodyChars));
      setAudioScript(
        `Explore ${nextBrand.name} from ${nextBrand.region}. Bottled at ${firstSku.abv} ABV. Order on Amazon UK with Challenge-25 delivery. Enjoy responsibly.`
      );
    }
  };

  const handleChannelSelect = (nextChannelId: AmazonAdChannelId) => {
    setChannelId(nextChannelId);
    const spec = AMAZON_AD_CHANNELS.find((c) => c.id === nextChannelId);
    if (spec && !activeFormat.supportedChannels.includes(nextChannelId)) {
      setFormatId(spec.defaultFormatId);
    }
  };

  const capViolations = useMemo(() => {
    const combined = `${headline} ${subheadline} ${bodyCopy} ${audioScript}`.toLowerCase();
    return PROHIBITED_CAP_PATTERNS.filter((p) => combined.includes(p.term));
  }, [headline, subheadline, bodyCopy, audioScript]);

  const handleGenerateAiCampaign = async () => {
    if (activeChannel.eligibilityStatus === 'prohibited') return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          skus: brandSkus,
          format: activeFormat,
          channel: activeChannel,
          objective,
          toneNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate campaign.');
      }
      if (data.headline) setHeadline(String(data.headline).slice(0, activeFormat.maxHeadlineChars));
      if (data.subheadline) setSubheadline(String(data.subheadline));
      if (data.bodyCopy) setBodyCopy(String(data.bodyCopy).slice(0, activeFormat.maxBodyChars));
      if (data.audioScript) setAudioScript(String(data.audioScript));
      if (data.ctaLabel) setCtaLabel(String(data.ctaLabel));
      if (Array.isArray(data.targetKeywords18Plus)) setTargetKeywords(data.targetKeywords18Plus);
      if (Array.isArray(data.excludedYouthKeywords)) setExcludedKeywords(data.excludedYouthKeywords);
      if (Array.isArray(data.videoRatingExclusions)) setRatingExclusions(data.videoRatingExclusions);
      if (data.creativeVisualBrief25Plus) setVisualBrief(String(data.creativeVisualBrief25Plus));
      if (data.engineUsed) setEngineUsedLabel(String(data.engineUsed));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach Gemini campaign generator.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveCurrentDraft = () => {
    if (activeChannel.eligibilityStatus === 'prohibited') return;
    onSaveDraft({
      id: `draft-${Date.now()}`,
      brandId: brand.id,
      brandName: brand.name,
      skuId: activeSku?.id || '',
      skuName: activeSku?.name || brand.name,
      formatId: activeFormat.id,
      channelId: activeChannel.id,
      headline,
      subheadline,
      bodyCopy,
      audioScript,
      ctaLabel,
      heroImageUrl: activeSku?.imageUrl || '',
      targetKeywords18Plus: targetKeywords,
      excludedYouthKeywords: excludedKeywords,
      videoRatingExclusions: ratingExclusions,
      creativeVisualBrief25Plus: visualBrief,
      abvAndUnitsComplianceLine: `${activeSku?.abv || '40%'} ABV · ${activeSku?.bottleSize || '700ml'} · Drinkaware.co.uk (18+)`,
      modelAge25Confirmed,
      includeResponsibleFooter,
      engineUsed: engineUsedLabel,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSavedFeedback('Saved to Campaign Drafts');
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  /* --------------------------------------------------------------------------
   * FULL-PAGE LIVE REPLICA RENDERER
   * ------------------------------------------------------------------------ */
  const renderReplicaSurface = () => {
    const primaryImg = activeSku?.imageUrl || '';
    const priceText = `£${(activeSku?.illustrativeRrpGbp || 42).toFixed(2)}`;
    const unitsEstimate = activeSku
      ? `${((parseFloat(activeSku.abv) || 40) * (parseFloat(activeSku.bottleSize) || 700) / 1000).toFixed(1)} UK Units`
      : '28.0 UK Units';

    // ALEXA PROHIBITED GUARD
    if (channelId === 'alexa') {
      return (
        <div className="p-8 bg-zinc-950 text-white min-h-[480px] flex flex-col items-center justify-center text-center space-y-5 border border-zinc-800">
          <div className="w-12 h-12 bg-[#FF6A00]/15 border border-[#FF6A00] flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#FF6A00]" />
          </div>
          <div className="max-w-md space-y-2">
            <div className="text-xs font-mono text-[#FF6A00]">AMAZON UK ALCOHOL POLICY BLOCK</div>
            <h3 className="text-lg font-bold">Alexa Voice Alcohol Advertising is Prohibited</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Under Amazon Advertising UK Alcohol Policy, alcohol brands cannot serve voice ads on Alexa Skills or Echo devices because household age-gating cannot be reliably guaranteed. Switch directly to compliant 18+ UK audio surfaces below.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => handleChannelSelect('amazon_music')}
              className="px-4 py-2 bg-[#FF6A00] hover:bg-[#E55F00] text-white text-xs font-semibold cursor-pointer"
            >
              Switch to Amazon Music (18+)
            </button>
            <button
              type="button"
              onClick={() => handleChannelSelect('wondery')}
              className="px-4 py-2 border border-zinc-700 hover:border-white text-white text-xs font-semibold cursor-pointer"
            >
              Switch to Wondery Podcasts (18+)
            </button>
          </div>
        </div>
      );
    }

    // PRIME VIDEO / LIVE SPORTS HUD
    if (channelId === 'prime_video' || channelId === 'live_sports') {
      const isSports = channelId === 'live_sports';
      return (
        <div className="bg-[#080B10] text-white border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-[#0F171E] border-b border-zinc-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#00A8E1] tracking-tight">
                {isSports ? 'prime video · LIVE SPORT UK' : 'prime video'}
              </span>
              <span className="text-zinc-400">
                {isSports
                  ? 'Premier League Live — Saturday Evening Kick-Off (18+ Account)'
                  : 'Reacher · Season 3 (BBFC 18 Rated · Mature Exclusion Active)'}
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">
              Excluded: {ratingExclusions.slice(0, 4).join(', ')}
            </span>
          </div>

          <div className="relative aspect-video bg-zinc-900 overflow-hidden flex items-end justify-between p-5">
            <img
              src={primaryImg}
              alt={brand.name}
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/30" />

            {/* Top Left Pause Tag */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-[11px] bg-black/75 border border-zinc-700 px-2.5 py-1">
              <span className="w-2 h-2 bg-[#FF6A00]" />
              <span className="font-mono">PAUSED · INTERACTIVE 18+ AD</span>
            </div>

            {/* Bottom Left Stream Title */}
            <div className="relative z-10 max-w-sm space-y-1">
              <div className="text-[11px] font-mono text-[#00A8E1]">
                {isSports ? 'HALF-TIME BROADCAST PAUSE' : 'STREAMING PAUSE SAFE-ZONE'}
              </div>
              <div className="text-lg font-bold leading-tight">{headline}</div>
              <p className="text-xs text-zinc-300 line-clamp-2">{bodyCopy}</p>
            </div>

            {/* Bottom Right Interactive Shop Overlay Card */}
            <div className="relative z-10 w-64 bg-white text-black p-3.5 shadow-2xl border border-zinc-200 space-y-2.5 shrink-0">
              <div className="flex gap-3 items-center">
                <ProductVisual
                  src={primaryImg}
                  alt={activeSku?.name || brand.name}
                  className="w-14 h-16 object-contain bg-white p-1 border border-zinc-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-zinc-500">
                    Sponsored · Amazon 1P
                  </div>
                  <div className="text-xs font-bold leading-snug line-clamp-2">
                    {activeSku?.name}
                  </div>
                  <div className="text-sm font-bold font-mono text-[#B12704] mt-0.5">
                    {priceText}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-600 border-t border-zinc-200 pt-2">
                <span>{activeSku?.abv} ABV · {unitsEstimate}</span>
                <span className="font-semibold text-[#007185]">{ctaLabel} →</span>
              </div>
              {includeResponsibleFooter && (
                <div className="text-[9px] text-zinc-500 border-t border-zinc-100 pt-1">
                  18+ UK only · Challenge-25 delivery · Enjoy responsibly
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // FIRE TV HOME FEATURE ROTATOR UI
    if (channelId === 'fire_tv') {
      return (
        <div className="bg-[#0B0E14] text-white border border-zinc-800 overflow-hidden">
          <div className="px-5 py-2.5 bg-black/70 border-b border-zinc-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-4">
              <span className="font-bold text-[#FF6A00]">fire tv</span>
              <span className="text-zinc-300 font-semibold border-b-2 border-white pb-0.5">Home</span>
              <span className="text-zinc-400">Live</span>
              <span className="text-zinc-400">Apps</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">Adult Household Profile (Kids Excluded)</span>
          </div>

          {/* Feature Rotator */}
          <div className="relative h-64 p-6 flex flex-col justify-end overflow-hidden">
            <img
              src={primaryImg}
              alt={brand.name}
              className="absolute inset-0 w-full h-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/75 to-transparent" />
            <div className="relative z-10 max-w-md space-y-2">
              <div className="text-[10px] font-mono text-[#FF6A00]">
                FEATURE ROTATOR · SPONSORED TILE (18+)
              </div>
              <h3 className="text-xl font-bold leading-tight">{headline}</h3>
              <p className="text-xs text-zinc-300">{bodyCopy}</p>
              <div className="flex items-center gap-3 pt-1">
                <span className="px-3 py-1.5 bg-white text-black text-xs font-bold">
                  {ctaLabel} · {priceText}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {activeSku?.abv} ABV · Sold by Amazon
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Sponsored Tile Row */}
          <div className="p-4 bg-[#10141D] border-t border-zinc-800">
            <div className="text-[11px] font-semibold text-zinc-400 mb-2.5">
              Amazon Storefront & Adult Entertaining Picks
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[activeSku, ...competitorSkus.slice(0, 3)].map((item, idx) => (
                <div
                  key={item?.id || idx}
                  className={`p-2 bg-zinc-900 border ${
                    idx === 0 ? 'border-[#FF6A00]' : 'border-zinc-800'
                  }`}
                >
                  <ProductVisual
                    src={item?.imageUrl || primaryImg}
                    alt={item?.name || 'BWS'}
                    className="w-full h-16 object-contain bg-white p-1 mb-1.5"
                  />
                  <div className="text-[10px] font-semibold truncate">{item?.brandName}</div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    £{(item?.illustrativeRrpGbp || 39).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // TWITCH 18+ STREAM UI
    if (channelId === 'twitch') {
      return (
        <div className="bg-[#0E0E10] text-white border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2 bg-[#18181B] border-b border-zinc-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#A970FF]">twitch</span>
              <span className="text-zinc-300">UK Culinary & Evening Talk · 18+ Mature Stream</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">18+ Gate Enforced · No Youth/Gaming Skill Claims</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-9 relative aspect-video bg-black flex flex-col justify-between p-4">
              <img
                src={primaryImg}
                alt={brand.name}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="relative z-10 flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 bg-black/80 border border-zinc-700 font-mono">
                  Ad · 0:15 Remaining · Skippable in 5s
                </span>
                <span className="px-2 py-0.5 bg-[#A970FF] text-black font-bold">18+ ONLY</span>
              </div>
              <div className="relative z-10 bg-black/85 border border-zinc-700 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{headline}</div>
                  <div className="text-[11px] text-zinc-300 truncate">{bodyCopy}</div>
                </div>
                <span className="px-3 py-1.5 bg-[#FF6A00] text-white text-xs font-bold shrink-0">
                  {ctaLabel} ({priceText})
                </span>
              </div>
            </div>
            <div className="md:col-span-3 bg-[#18181B] border-l border-zinc-800 p-3 text-[11px] space-y-2">
              <div className="font-semibold text-zinc-400 uppercase text-[10px]">Stream Chat (18+)</div>
              <div className="text-zinc-300">
                <strong className="text-[#A970FF]">Host_UK:</strong> Pairing tonight’s roast with {brand.name}.
              </div>
              <div className="text-zinc-400">
                <strong className="text-emerald-400">ModBot:</strong> Link pinned: Amazon UK 1P Store ({activeSku?.abv} ABV).
              </div>
            </div>
          </div>
        </div>
      );
    }

    // IMDB.COM MATURE FILM PAGE
    if (channelId === 'imdb') {
      return (
        <div className="bg-[#121212] text-white border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2 bg-black border-b border-zinc-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-[#F5C518] text-black font-extrabold">IMDb</span>
              <span className="text-zinc-300">UK Title Page · Cert 15 / 18 Drama Thriller</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">728×90 Leaderboard + 300×250 REC</span>
          </div>

          {/* 728x90 Leaderboard Slot */}
          <div className="p-3 bg-[#1A1A1A] border-b border-zinc-800 flex justify-center">
            <div className="w-full max-w-[728px] bg-white text-black p-2.5 flex items-center justify-between gap-4 border border-zinc-300">
              <div className="flex items-center gap-3 min-w-0">
                <ProductVisual
                  src={primaryImg}
                  alt={brand.name}
                  className="w-16 h-14 object-contain bg-white p-1 border border-zinc-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-zinc-500">
                    Sponsored · Amazon UK Official 1P
                  </div>
                  <div className="text-xs font-bold truncate">{headline}</div>
                  <div className="text-[11px] text-zinc-600 truncate">
                    {activeSku?.name} · {activeSku?.abv} ABV · {priceText}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-[#F5C518] text-black text-xs font-bold shrink-0">
                {ctaLabel} on Amazon
              </span>
            </div>
          </div>

          {/* Title Content + 300x250 Right Rail */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-7 space-y-2">
              <div className="text-lg font-bold">The Speyside Syndicate (2026)</div>
              <div className="text-[11px] text-zinc-400">Cert 18 · Crime Drama · 2h 14m · IMDb UK</div>
              <div className="h-36 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-zinc-400 gap-2">
                <Play className="w-5 h-5 text-[#F5C518]" />
                <span>Mature Trailer Feed (U/PG Family Content Excluded)</span>
              </div>
            </div>
            <div className="md:col-span-5 bg-white text-black p-3 border border-zinc-300 space-y-2">
              <div className="text-[10px] text-zinc-500 flex justify-between">
                <span>Amazon DSP 300×250 REC</span>
                <span>18+</span>
              </div>
              <div className="flex gap-3 items-center">
                <ProductVisual src={primaryImg} alt={brand.name} className="w-20 h-24 object-contain bg-white p-1 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-bold line-clamp-2">{activeSku?.name}</div>
                  <div className="text-sm font-bold text-[#B12704] font-mono">{priceText}</div>
                  <div className="text-[10px] text-zinc-600">{activeSku?.abv} ABV · Prime 1P</div>
                  <span className="inline-block px-2.5 py-1 bg-[#FFD814] text-black text-[11px] font-semibold">
                    {ctaLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // AMAZON MUSIC / WONDERY PODCAST PLAYER
    if (channelId === 'amazon_music' || channelId === 'wondery') {
      const isWondery = channelId === 'wondery';
      return (
        <div className="bg-[#0B0C10] text-white border border-zinc-800 p-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-56 h-56 shrink-0 bg-white text-black p-3 flex flex-col justify-between border border-zinc-300">
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>500×500 Companion Banner</span>
              <span>18+</span>
            </div>
            <ProductVisual
              src={primaryImg}
              alt={brand.name}
              className="w-full h-32 object-contain bg-white p-1 border border-zinc-200"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold truncate">{brand.name}</span>
              <span className="px-2 py-1 bg-[#FF6A00] text-white text-[10px] font-bold shrink-0">
                {ctaLabel}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-[#00A8E1] font-semibold">
              <Volume2 className="w-4 h-4" />
              <span>
                {isWondery
                  ? 'WONDERY UK · True Crime & Gastronomy Podcast (18+)'
                  : 'AMAZON MUSIC UK · Evening Jazz & Craft Dining Playlist'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{headline}</h3>
            <div className="p-3.5 bg-zinc-900 border border-zinc-800 space-y-1.5">
              <div className="text-[10px] font-mono text-[#FF6A00]">
                20-SECOND AUDIO SPOT SCRIPT (KIDS/FAMILY EXCLUDED)
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed italic">&ldquo;{audioScript}&rdquo;</p>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-zinc-800 w-full">
                <div className="h-full bg-[#FF6A00] w-2/3" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>0:14 / 0:20 Sponsored Audio</span>
                <span>{activeSku?.abv} ABV · {priceText} on Amazon UK</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // AMAZON KINDLE E-INK LOCKSCREEN
    if (channelId === 'kindle') {
      return (
        <div className="bg-zinc-200 dark:bg-zinc-900 p-6 border border-zinc-300 dark:border-zinc-800 flex justify-center">
          <div className="w-72 bg-[#E9E7DF] text-zinc-900 border-8 border-zinc-900 p-4 space-y-3 shadow-xl">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 flex justify-between border-b border-zinc-400 pb-1.5">
              <span>Kindle Wakescreen (18+ Adult)</span>
              <span>Sponsored</span>
            </div>
            <ProductVisual
              src={primaryImg}
              alt={brand.name}
              className="w-full h-44 object-contain bg-white p-1.5 grayscale contrast-125 border border-zinc-400"
            />
            <div className="space-y-1 text-center">
              <div className="text-sm font-bold leading-snug">{headline}</div>
              <div className="text-[11px] text-zinc-700">
                {activeSku?.name} · {activeSku?.abv} ABV · {priceText}
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-400 text-[10px] text-center font-semibold">
              Swipe to Unlock · Shop on Amazon.co.uk (18+ Only)
            </div>
          </div>
        </div>
      );
    }

    // WHOLE FOODS / OPEN-WEB PUBLISHER DSP
    if (channelId === 'whole_foods_dsp') {
      return (
        <div className="bg-white text-zinc-900 border border-zinc-300 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
            <span className="font-serif font-bold text-base">
              The London Table & Cellar Review
            </span>
            <span className="text-[11px] font-mono text-[#00674B]">
              Whole Foods & Fine Wine DSP Audience (18+)
            </span>
          </div>

          {recSize === '728x90' && (
            <div className="p-3 bg-zinc-100 border-b border-zinc-200 flex justify-center">
              <div className="w-full max-w-[728px] bg-white border border-zinc-300 p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ProductVisual src={primaryImg} alt={brand.name} className="w-16 h-14 object-contain bg-white p-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-zinc-500">Amazon DSP 728×90 · Vendor Central 1P</div>
                    <div className="text-xs font-bold truncate">{headline} — {priceText}</div>
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-[#FFD814] text-black text-xs font-bold shrink-0">{ctaLabel}</span>
              </div>
            </div>
          )}

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 space-y-2 text-xs text-zinc-600 leading-relaxed">
              <h4 className="text-base font-bold text-black">
                Winter Tasting Guide: Single-Estate Provenance Bottles Under £75
              </h4>
              <p>
                Across UK specialist dining tables this season, sommeliers and spirit buyers are spotlighting independent producers prioritizing raw agricultural provenance and small-batch wood maturation.
              </p>
              <p>
                Readers ordering directly via Amazon UK’s 1P Prime storefront verify bottle ABV%, origin seals, and Challenge-25 adult delivery safeguards.
              </p>
            </div>

            <div className="md:col-span-5 border border-zinc-300 p-3.5 bg-zinc-50 space-y-2.5">
              <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                <span>DSP REC ({recSize})</span>
                <span>18+ UK</span>
              </div>
              <ProductVisual
                src={primaryImg}
                alt={brand.name}
                className={`w-full object-contain bg-white p-1.5 border border-zinc-200 ${
                  recSize === '300x600' ? 'h-56' : 'h-32'
                }`}
              />
              <div className="text-xs font-bold text-black">{headline}</div>
              <div className="text-[11px] text-zinc-600">{activeSku?.name} · {activeSku?.abv} ABV</div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold font-mono text-[#B12704]">{priceText}</span>
                <span className="px-3 py-1 bg-[#FFD814] text-black text-xs font-bold">
                  {ctaLabel} on Amazon
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // AMAZON POSTS FEED
    if (formatId === 'amazon_posts') {
      return (
        <div className="bg-[#F7F7F7] text-zinc-900 border border-zinc-300 p-5 flex justify-center">
          <div className="w-full max-w-md bg-white border border-zinc-200 overflow-hidden shadow-sm">
            <div className="p-3.5 flex items-center justify-between border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-xs">
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-black">{brand.name}</div>
                  <div className="text-[10px] text-zinc-500">Amazon Posts · Official Brand Store</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#007185]">+ Follow</span>
            </div>

            <ProductVisual src={primaryImg} alt={brand.name} className="w-full h-72 object-contain bg-white p-2" />

            <div className="p-3.5 bg-zinc-50 border-y border-zinc-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-black truncate">{activeSku?.name}</div>
                <div className="text-[11px] font-mono text-[#B12704] font-bold">
                  {priceText} · Prime · {activeSku?.abv} ABV
                </div>
              </div>
              <span className="px-2.5 py-1 bg-[#FFD814] text-black text-[11px] font-semibold shrink-0">
                View Product
              </span>
            </div>

            <div className="p-3.5 space-y-1.5 text-xs">
              <div>
                <span className="font-bold">{brand.name}: </span>
                <span>{bodyCopy.slice(0, 100)}</span>
                {bodyCopy.length >= 100 && <span className="text-zinc-400">... See more</span>}
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                Above-the-fold caption length: {Math.min(bodyCopy.length, 100)} / 100 chars · 18+ Drinkaware.co.uk
              </div>
            </div>
          </div>
        </div>
      );
    }

    // AMAZON PDP REPLICA (Sponsored Display Product / Custom)
    if (formatId === 'sd_product' || formatId === 'sd_custom') {
      const targetComp = competitorSkus[0] || activeSku;
      return (
        <div className="bg-white text-zinc-900 border border-zinc-300 overflow-hidden">
          <div className="px-4 py-2.5 bg-[#131921] text-white flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm tracking-tight">
                amazon<span className="text-[#FF9900]">.co.uk</span>
              </span>
              <span className="text-[11px] text-zinc-300 hidden sm:inline">Deliver to London SW1</span>
            </div>
            <div className="flex-1 max-w-md bg-white text-zinc-500 px-3 py-1 text-[11px] truncate">
              {targetComp?.category} · {targetComp?.brandName}
            </div>
            <span className="text-[11px] text-zinc-300">18+ Challenge-25</span>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
            <div className="lg:col-span-4">
              <ProductVisual
                src={targetComp?.imageUrl || primaryImg}
                alt={targetComp?.name || 'Competing SKU'}
                className="w-full h-64 object-contain bg-white p-2 border border-zinc-200"
              />
            </div>

            <div className="lg:col-span-4 space-y-2">
              <div className="text-[11px] text-[#007185]">Visit the {targetComp?.brandName} Store</div>
              <h3 className="text-base font-bold text-black leading-snug">{targetComp?.name}</h3>
              <div className="text-[#FF9900] text-xs">★★★★☆ <span className="text-[#007185]">412 ratings</span></div>
              <div className="pt-2 border-t border-zinc-200">
                <div className="text-lg font-bold text-black font-mono">
                  £{(targetComp?.illustrativeRrpGbp || 45).toFixed(2)}
                </div>
                <div className="text-[11px] text-zinc-600">
                  Dispatched from and sold by Amazon (1P Vendor Central)
                </div>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-700 pt-2">
                <li>ABV: {targetComp?.abv} · Bottle Size: {targetComp?.bottleSize}</li>
                <li>{targetComp?.packagingInfo}</li>
                <li>Age-verified UK delivery required upon arrival (18+)</li>
              </ul>
            </div>

            {/* Right Rail Buy Box + Sponsored Display Placement */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-3 border border-zinc-300 space-y-2 bg-zinc-50">
                <div className="font-bold font-mono text-sm">
                  £{(targetComp?.illustrativeRrpGbp || 45).toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">In Stock · Prime 1P</div>
                <div className="w-full py-1.5 bg-[#FFD814] text-center font-semibold text-black">
                  Add to Basket
                </div>
              </div>

              {/* LIVE SPONSORED DISPLAY AD UNDER BUY BOX */}
              <div className="border-2 border-[#FF6A00] p-3 bg-white space-y-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="font-bold text-[#FF6A00]">YOUR LIVE SPONSORED DISPLAY AD</span>
                  <span>Sponsored</span>
                </div>
                <div className="flex gap-3 items-center">
                  <ProductVisual
                    src={primaryImg}
                    alt={activeSku?.name || brand.name}
                    className="w-16 h-20 object-contain bg-white p-1 border border-zinc-200 shrink-0"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-bold text-black line-clamp-2">{headline}</div>
                    <div className="text-[11px] text-zinc-600 truncate">{activeSku?.name}</div>
                    <div className="text-xs font-bold font-mono text-[#B12704]">
                      {priceText} · {activeSku?.abv} ABV
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[10px]">
                  <span className="text-zinc-500">{unitsEstimate} · 18+</span>
                  <span className="font-bold text-[#007185]">{ctaLabel} →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // DEFAULT: FULL AMAZON.CO.UK SEARCH RESULTS PAGE REPLICA
    const searchGridSkus = [activeSku, ...competitorSkus.slice(0, 3)];
    return (
      <div className="bg-white text-zinc-900 border border-zinc-300 overflow-hidden">
        {/* Amazon UK Top Navigation Bar */}
        <div className="px-4 py-2.5 bg-[#131921] text-white flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tracking-tight">
              amazon<span className="text-[#FF9900]">.co.uk</span>
            </span>
            <span className="text-[11px] text-zinc-300 hidden sm:inline">Deliver to UK</span>
          </div>
          <div className="flex-1 max-w-lg bg-white text-black px-3 py-1.5 text-[11px] flex items-center justify-between">
            <span className="truncate font-medium">
              {brand.primaryCategory.toLowerCase()} gift bottle uk 18+
            </span>
            <span className="px-2 py-0.5 bg-[#FEBD69] text-black font-bold">Search</span>
          </div>
          <span className="text-[11px] text-zinc-300 hidden md:inline">Prime · Orders</span>
        </div>

        {/* Sub-nav */}
        <div className="px-4 py-1.5 bg-[#232F3E] text-zinc-200 text-[11px] flex items-center gap-4 overflow-x-auto">
          <span className="font-bold">Beer, Wine & Spirits</span>
          <span>Single Malts & Spirits</span>
          <span>Wine & Champagne</span>
          <span>Vendor Central 1P Official</span>
          <span className="ml-auto text-amber-300 font-mono">Challenge-25 UK Verified</span>
        </div>

        {/* Top-of-Search Sponsored Brands Banner */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200">
          <div className="border-2 border-[#FF6A00] bg-white p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="font-mono font-bold text-[#FF6A00]">
                  {activeFormat.name.toUpperCase()}
                </span>
                <span>· Sponsored</span>
              </div>
              <div className="text-base font-bold text-black leading-snug">{headline}</div>
              <p className="text-[11px] text-zinc-600">{bodyCopy}</p>
              <div className="text-[11px] font-semibold text-[#007185]">{ctaLabel} · Shop {brand.name} Store →</div>
            </div>

            <div className="md:col-span-7 grid grid-cols-3 gap-2.5">
              {(brandSkus.length >= 3 ? brandSkus.slice(0, 3) : [activeSku, ...competitorSkus.slice(0, 2)]).map(
                (item, idx) => (
                  <div
                    key={`${item?.id}-${idx}`}
                    className="border border-zinc-200 p-2 bg-zinc-50 space-y-1"
                  >
                    <ProductVisual
                      src={item?.imageUrl || primaryImg}
                      alt={item?.name || brand.name}
                      className="w-full h-24 object-contain bg-white p-1"
                    />
                    <div className="text-[11px] font-semibold text-black line-clamp-2 leading-tight">
                      {item?.name}
                    </div>
                    <div className="text-xs font-bold font-mono text-[#B12704]">
                      £{(item?.illustrativeRrpGbp || 42).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-zinc-500">{item?.abv} ABV</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Search Results Body (Left Filter Rail + 4-Product Grid) */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          <div className="hidden md:block md:col-span-3 space-y-3 border-r border-zinc-200 pr-3 text-[11px]">
            <div>
              <div className="font-bold text-black mb-1">Delivery Day</div>
              <div className="text-zinc-600">☑ Prime Next-Day (18+ Signature)</div>
            </div>
            <div>
              <div className="font-bold text-black mb-1">Category</div>
              <div className="font-semibold text-[#C45500]">{brand.primaryCategory}</div>
              <div className="text-zinc-600">Gift Sets & Hampers</div>
            </div>
            <div>
              <div className="font-bold text-black mb-1">Seller</div>
              <div className="text-zinc-600">☑ Amazon.co.uk (1P Vendor Central)</div>
            </div>
          </div>

          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {searchGridSkus.map((sku, idx) => (
              <div
                key={`${sku?.id}-${idx}`}
                className={`border p-2.5 flex flex-col justify-between gap-2 ${
                  idx === 0 ? 'border-[#FF6A00] bg-orange-50/30' : 'border-zinc-200 bg-white'
                }`}
              >
                <div>
                  {idx === 0 && (
                    <div className="text-[10px] font-bold text-[#FF6A00] mb-1">
                      Sponsored Product (Your SKU)
                    </div>
                  )}
                  <ProductVisual
                    src={sku?.imageUrl || primaryImg}
                    alt={sku?.name || 'BWS'}
                    className="w-full h-32 object-contain bg-white p-1.5 border border-zinc-100 mb-2"
                  />
                  <div className="text-xs font-semibold text-black line-clamp-2 leading-snug">
                    {sku?.name}
                  </div>
                  <div className="text-[11px] text-[#FF9900] mt-1">★★★★☆ (184)</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold font-mono text-black">
                    £{(sku?.illustrativeRrpGbp || 39).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {sku?.abv} ABV · {sku?.bottleSize} · Amazon 1P
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Vendor Central UK (1P) · Omnichannel Ad Builder"
        title="AI Campaign Studio & Live Amazon Ecosystem Previews"
        description="Generate ASA/CAP Code Section 18 & Amazon UK compliant campaigns grounded in live brand & SKU data, previewed inside full-page product-populated replicas across Amazon.co.uk, Prime Video, Live Sports, Fire TV, Twitch, IMDb, Amazon Music, Wondery, Kindle & DSP."
      />

      <PrototypeBannerNote text="Active campaign generation is locked to Mercenta's built-in Gemini AI build engine (gemini-4-hydrogen) during development. Zero FBA—all previews and Deep Links route to Amazon Vendor Central UK (1P) ASINs." />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: BUILDER & COMPLIANCE ENGINE (5 COLS) */}
        <div className="xl:col-span-5 space-y-5">
          {/* Locked Built-in Engine Status Banner */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-black text-white p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#FF6A00]">
                <Lock className="w-3.5 h-3.5" />
                <span>Campaign Copy Engine: Built-in Gemini Locked</span>
              </span>
              <span className="font-mono text-[11px] text-emerald-400">Active</span>
            </div>
            <div className="text-[11px] text-zinc-300">
              Visual Image Routing: <span className="font-mono text-white">{selectedImageModel}</span> · Video Routing:{' '}
              <span className="font-mono text-white">{selectedVideoModel}</span>
            </div>
          </div>

          {/* Brand & Live SKU Selector */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-4 text-xs">
            <div className="font-semibold text-black dark:text-white text-sm">
              1. Brand & Live SKU Context
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Partner Brand</label>
                <select
                  value={brand.id}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.countryName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Primary SKU</label>
                <select
                  value={activeSku?.id || ''}
                  onChange={(e) => setSelectedSkuId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                >
                  {brandSkus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.abv})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeSku && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex gap-3 items-center">
                <ProductVisual
                  src={activeSku.imageUrl}
                  alt={activeSku.name}
                  className="w-14 h-16 object-contain bg-white dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800 shrink-0"
                />
                <div className="min-w-0 space-y-0.5 text-[11px]">
                  <div className="font-semibold text-black dark:text-white truncate">{activeSku.name}</div>
                  <div className="font-mono text-[#FF6A00]">
                    {activeSku.abv} ABV · {activeSku.bottleSize} · RRP £{activeSku.illustrativeRrpGbp.toFixed(2)}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {activeSku.tastingNotes || activeSku.packagingInfo}
                  </div>
                </div>
              </div>
            )}

            {/* 12 Ecosystem Channels Matrix */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="font-semibold text-black dark:text-white">
                2. Ecosystem Placement Channel (All 12 Screenshot Surfaces)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMAZON_AD_CHANNELS.map((ch) => {
                  const active = ch.id === channelId;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleChannelSelect(ch.id)}
                      className={`p-2 border text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-[#FF6A00] bg-zinc-950 text-white dark:bg-white dark:text-black'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-zinc-400'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">{ch.name}</div>
                      <div
                        className={`text-[10px] font-mono mt-0.5 truncate ${
                          ch.eligibilityStatus === 'prohibited'
                            ? 'text-red-500 font-bold'
                            : ch.eligibilityStatus === 'conditional'
                            ? 'text-amber-600 dark:text-amber-400'
                            : active
                            ? 'text-[#FF6A00]'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {ch.eligibilityStatus === 'prohibited'
                          ? 'Prohibited'
                          : ch.eligibilityStatus === 'conditional'
                          ? '18+ Conditional'
                          : 'Permitted'}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
                <strong className="text-black dark:text-white">{activeChannel.name}:</strong>{' '}
                {activeChannel.alcoholRuleNote}
              </div>
            </div>

            {/* 11 Official Ad Formats */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="font-semibold text-black dark:text-white">
                3. Official Amazon Ad Format ({AMAZON_AD_FORMATS.length} Formats)
              </div>
              <select
                value={formatId}
                onChange={(e) => setFormatId(e.target.value as AmazonAdFormatId)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
              >
                {AMAZON_AD_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.billingModel})
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Specs: <span className="font-mono text-black dark:text-white">{activeFormat.dimensions}</span> ·
                Headline max {activeFormat.maxHeadlineChars} chars
              </div>
            </div>

            {/* AI Generation Inputs & Button */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Campaign objective..."
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                />
                <input
                  type="text"
                  value={toneNote}
                  onChange={(e) => setToneNote(e.target.value)}
                  placeholder="Brand tone direction..."
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                />
              </div>

              <button
                type="button"
                disabled={aiLoading || activeChannel.eligibilityStatus === 'prohibited'}
                onClick={handleGenerateAiCampaign}
                className="w-full py-2.5 px-4 bg-[#FF6A00] hover:bg-[#E55F00] disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {aiLoading
                    ? 'Generating Compliant UK Campaign via Gemini...'
                    : 'Generate Compliant UK Campaign (Gemini AI)'}
                </span>
              </button>

              {aiError && (
                <div className="p-2.5 border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-[11px]">
                  {aiError}
                </div>
              )}
            </div>
          </div>

          {/* Copy Editor & Real-Time ASA CAP Section 18 Scanner */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-black dark:text-white">
                4. Live Copy & UK ASA / CAP Section 18 Scanner
              </span>
              {capViolations.length === 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Copy Clear</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{capViolations.length} Rule Flag(s)</span>
                </span>
              )}
            </div>

            {capViolations.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-900 space-y-1 text-[11px] text-red-700 dark:text-red-300">
                {capViolations.map((v) => (
                  <div key={v.term}>
                    <strong>Prohibited term &ldquo;{v.term}&rdquo;:</strong> {v.reason}
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                <span>Ad Headline</span>
                <span className="font-mono">
                  {headline.length} / {activeFormat.maxHeadlineChars}
                </span>
              </div>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                <span>Body / Amazon Posts Above-the-Fold Copy</span>
                <span className="font-mono">
                  {bodyCopy.length} / {activeFormat.maxBodyChars}
                </span>
              </div>
              <textarea
                rows={2}
                value={bodyCopy}
                onChange={(e) => setBodyCopy(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modelAge25Confirmed}
                  onChange={(e) => setModelAge25Confirmed(e.target.checked)}
                  className="accent-[#FF6A00]"
                />
                <span>Models / Hands 25+ Attested</span>
              </label>
              <label className="flex items-center gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeResponsibleFooter}
                  onChange={(e) => setIncludeResponsibleFooter(e.target.checked)}
                  className="accent-[#FF6A00]"
                />
                <span>18+ Drinkaware Signpost</span>
              </label>
            </div>

            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1">
              <div>
                <strong className="text-black dark:text-white">18+ Target Keywords:</strong>{' '}
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
                  {targetKeywords.join(' · ')}
                </span>
              </div>
              <div>
                <strong className="text-black dark:text-white">25+ Visual Direction:</strong>{' '}
                <span className="text-zinc-600 dark:text-zinc-400">{visualBrief}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {savedFeedback || `Engine: ${engineUsedLabel}`}
              </span>
              <button
                type="button"
                disabled={activeChannel.eligibilityStatus === 'prohibited' || capViolations.length > 0 || !modelAge25Confirmed}
                onClick={handleSaveCurrentDraft}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black disabled:opacity-40 text-xs font-semibold hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Compliant Draft</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FULL-PAGE LIVE ECOSYSTEM REPLICA VIEWPORT (7 COLS) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-black dark:text-white">
                Live Page Replica: {activeChannel.name} — {activeFormat.name}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Real-time rendering populated with live Partner SKU imagery, ABV%, GBP RRP & competing UK BWS listings.
              </div>
            </div>

            <div className="flex items-center gap-2">
              {formatId === 'dsp_rec' && (
                <select
                  value={recSize}
                  onChange={(e) => setRecSize(e.target.value as '300x250' | '728x90' | '300x600')}
                  aria-label="DSP REC Ad Dimensions"
                  className="px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white font-mono"
                >
                  <option value="300x250">300×250 REC</option>
                  <option value="728x90">728×90 Leaderboard</option>
                  <option value="300x600">300×600 Half Page</option>
                </select>
              )}

              <div className="flex border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewportMode('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium cursor-pointer ${
                    viewportMode === 'desktop'
                      ? 'bg-white dark:bg-black text-black dark:text-white'
                      : 'text-zinc-500'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('mobile')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium cursor-pointer ${
                    viewportMode === 'mobile'
                      ? 'bg-white dark:bg-black text-black dark:text-white'
                      : 'text-zinc-500'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>
          </div>

          <div
            className={`transition-all mx-auto ${
              viewportMode === 'mobile' ? 'max-w-[420px]' : 'w-full'
            }`}
          >
            {renderReplicaSurface()}
          </div>
        </div>
      </div>

      {/* SAVED DRAFTS + SEEDED CAMPAIGN CONCEPTS */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Saved AI Campaign Drafts & Active Partner Concepts ({campaignDrafts.length + CAMPAIGNS.length})
          </h3>
          <span className="text-xs font-mono text-[#FF6A00]">
            Vendor Central UK 1P · CAP Section 18 Audited
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
          {campaignDrafts.map((draft) => (
            <div key={draft.id} className="p-5 flex gap-4 items-start border-b border-zinc-200 dark:border-zinc-800">
              <ProductVisual
                src={draft.heroImageUrl}
                alt={draft.headline}
                className="w-24 h-24 object-contain bg-white dark:bg-zinc-950 p-1.5 border border-zinc-200 dark:border-zinc-800 shrink-0"
              />
              <div className="min-w-0 space-y-1 text-xs">
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#FF6A00]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI DRAFT · {draft.brandName}</span>
                </div>
                <div className="font-bold text-black dark:text-white">{draft.headline}</div>
                <div className="text-zinc-600 dark:text-zinc-400 line-clamp-2">{draft.bodyCopy}</div>
                <div className="text-[11px] font-mono text-zinc-500">
                  {draft.channelId} · {draft.formatId} · {draft.createdAt}
                </div>
              </div>
            </div>
          ))}

          {CAMPAIGNS.map((camp) => (
            <div key={camp.id} className="p-5 flex gap-4 items-start border-b border-zinc-200 dark:border-zinc-800">
              <ProductVisual
                src={camp.heroVisual}
                alt={camp.campaignTitle}
                className="w-24 h-24 object-contain bg-white dark:bg-zinc-950 p-1.5 border border-zinc-200 dark:border-zinc-800 shrink-0"
              />
              <div className="min-w-0 space-y-1 text-xs">
                <div className="text-[11px] font-mono text-[#FF6A00]">
                  {camp.brandName} · {camp.targetPeriod}
                </div>
                <div className="font-bold text-black dark:text-white">{camp.campaignTitle}</div>
                <div className="text-zinc-600 dark:text-zinc-400 line-clamp-2">{camp.contentSummary}</div>
                <div className="text-[11px] text-zinc-500">{camp.channel} · {camp.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
