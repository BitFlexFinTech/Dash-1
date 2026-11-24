import {
  AmazonUkListingRecord,
  BrandProfile,
  DrinkCategory,
  MutualBenefitAnalysis,
  OpportunityAssessmentRecord,
  ProductSku,
  RadarBenchmarkMetrics,
  RadarComparisonMode,
  SkuPricePoint,
  UkDistributionRecord,
} from '../types/bws';

const UK_MONTHS_12 = [
  'Dec 25',
  'Jan 26',
  'Feb 26',
  'Mar 26',
  'Apr 26',
  'May 26',
  'Jun 26',
  'Jul 26',
  'Aug 26',
  'Sep 26',
  'Oct 26',
  'Nov 26',
];

function clampScore(val: number, min = 8, max = 98): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function stableHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function roundGbp(val: number): number {
  return Math.round(Math.max(0.5, val) * 100) / 100;
}

function getCategoryMedianRrp(category: DrinkCategory, skus: ProductSku[]): number {
  const catPrices = skus
    .filter((s) => s.category === category && s.illustrativeRrpGbp > 0)
    .map((s) => s.illustrativeRrpGbp)
    .sort((a, b) => a - b);
  if (catPrices.length === 0) return 26;
  const mid = Math.floor(catPrices.length / 2);
  return catPrices.length % 2 === 0
    ? (catPrices[mid - 1] + catPrices[mid]) / 2
    : catPrices[mid];
}

export function computeBrandRadarMetrics(
  brand: BrandProfile,
  brands: BrandProfile[],
  skus: ProductSku[],
  amazonListings: AmazonUkListingRecord[]
): RadarBenchmarkMetrics {
  const brandSkus = skus.filter((s) => s.brandId === brand.id);
  const primarySku = brandSkus[0];
  const listing = amazonListings.find((a) => a.brandId === brand.id);
  const medianRrp = getCategoryMedianRrp(brand.primaryCategory, skus);

  const rrp = primarySku?.illustrativeRrpGbp || listing?.displayedPriceGbp || medianRrp;
  const wholesale =
    primarySku?.illustrativeWholesaleGbp || roundGbp(rrp * 0.62);
  const observed = listing?.displayedPriceGbp ?? rrp;

  // 1. Price Point (0-100): competitiveness relative to category median + pricing integrity vs RRP
  const ratioToMedian = medianRrp > 0 ? rrp / medianRrp : 1;
  const categoryPositionScore =
    ratioToMedian <= 1.2
      ? 84 - Math.abs(1 - ratioToMedian) * 28
      : Math.max(38, 82 - (ratioToMedian - 1.2) * 30);
  const rrpDriftRatio = rrp > 0 ? Math.abs(observed - rrp) / rrp : 0.1;
  const pricingDisciplineBonus = Math.max(-16, 14 - rrpDriftRatio * 65);
  const pricePoint = clampScore(categoryPositionScore + pricingDisciplineBonus);

  // 2. Distribution Coverage (0-100): UK channel maturity + global export footprint
  let ukStatusPts = 14;
  if (brand.ukPresenceStatus === 'Present (Verified Distributor)') ukStatusPts = 38;
  else if (brand.ukPresenceStatus === 'Present (Multiple Sellers)') ukStatusPts = 28;
  else if (brand.ukPresenceStatus === 'Limited / Sporadic') ukStatusPts = 18;

  let arrangementPts = 8;
  if (brand.ukArrangementType === 'Exclusive (Verified)') arrangementPts = 20;
  else if (brand.ukArrangementType === 'Non-Exclusive (Verified)') arrangementPts = 16;
  else if (brand.ukArrangementType === 'Unverified / Grey Channel') arrangementPts = 10;

  const marketPts = Math.min(26, brand.internationalMarkets.length * 4.2);
  const distributorPts = Math.min(16, brand.internationalDistributors.length * 5.5);
  const distributionCoverage = clampScore(
    ukStatusPts + arrangementPts + marketPts + distributorPts
  );

  // 3. Marketing Reach (0-100): Amazon listing quality, range coverage, listings depth & storytelling
  let qualityPts = 18;
  if (listing?.listingQualityScore === 'Strong (A+ & Brand Registry)') qualityPts = 42;
  else if (listing?.listingQualityScore === 'Moderate (Basic Images)') qualityPts = 27;
  else if (listing?.listingQualityScore === 'Poor (Duplicate / Incomplete)') qualityPts = 15;
  else if (listing?.listingQualityScore === 'Unclaimed') qualityPts = 10;
  else if (brand.amazonUkPresence.startsWith('Sold by Amazon')) qualityPts = 36;

  const coveragePts = listing
    ? Math.min(30, Math.round(listing.rangeCoveragePct * 0.34))
    : Math.min(22, brandSkus.length * 8);
  const listingsBreadthPts = listing
    ? Math.min(18, listing.totalBrandListings * 1.4)
    : Math.min(14, brand.skuIds.length * 4);
  const storytellingPts = primarySku?.tastingNotes ? 8 : 4;
  const marketingReach = clampScore(
    qualityPts + coveragePts + listingsBreadthPts + storytellingPts
  );

  // 4. Amazon 1P Control (0-100): Sold by Amazon Buy Box governance
  let amazon1pControl = 20;
  if (brand.amazonUkPresence === 'Sold by Amazon (1P Vendor Central Active)') {
    amazon1pControl = listing?.listingStatus === 'Active (1P Buy Box)' ? 92 : 86;
  } else if (brand.amazonUkPresence === 'Sold by Amazon + 3P Resellers') {
    amazon1pControl = 66;
  } else if (brand.amazonUkPresence.includes('Sold by 3P Resellers Only')) {
    amazon1pControl = listing?.displayedPriceGbp ? 30 : 24;
  } else {
    amazon1pControl = 15;
  }
  if (listing?.sellerClassification === 'Amazon Vendor Central UK (1P)') {
    amazon1pControl = Math.min(96, amazon1pControl + 4);
  }

  // 5. Brand Margin (0-100): Wholesale-to-RRP 1P margin headroom
  const rawMarginPct = rrp > 0 ? ((rrp - wholesale) / rrp) * 100 : 32;
  const brandMargin = clampScore(18 + rawMarginPct * 1.55);

  const is1pLeader = brand.amazonUkPresence.startsWith('Sold by Amazon');

  return {
    brandId: brand.id,
    brandName: brand.name,
    pricePoint,
    distributionCoverage,
    marketingReach,
    amazon1pControl,
    brandMargin,
    is1pLeader,
  };
}

export interface RadarPeerComparison {
  selected: RadarBenchmarkMetrics;
  peers: {
    id: string;
    label: string;
    roleLabel: string;
    metrics: RadarBenchmarkMetrics;
  }[];
  availableCustomPeers: BrandProfile[];
}

export function selectRadarComparisonPeers(
  selectedBrand: BrandProfile,
  brands: BrandProfile[],
  skus: ProductSku[],
  amazonListings: AmazonUkListingRecord[],
  mode: RadarComparisonMode,
  customPeerId?: string
): RadarPeerComparison {
  const allMetrics = brands.map((b) =>
    computeBrandRadarMetrics(b, brands, skus, amazonListings)
  );
  const byId = new Map(allMetrics.map((m) => [m.brandId, m]));
  const selected = byId.get(selectedBrand.id)!;

  const sameCategoryBrands = brands.filter(
    (b) =>
      b.id !== selectedBrand.id &&
      (b.primaryCategory === selectedBrand.primaryCategory ||
        b.categories.includes(selectedBrand.primaryCategory))
  );

  const scoreLeaderRank = (m: RadarBenchmarkMetrics) =>
    m.amazon1pControl * 0.4 + m.marketingReach * 0.35 + m.distributionCoverage * 0.25;

  // Prefer same-category brands with active "Sold by Amazon" 1P status
  const sameCat1p = sameCategoryBrands
    .map((b) => byId.get(b.id)!)
    .filter((m) => m.is1pLeader)
    .sort((a, b) => scoreLeaderRank(b) - scoreLeaderRank(a));

  const fallbackSameCat = sameCategoryBrands
    .map((b) => byId.get(b.id)!)
    .filter((m) => !sameCat1p.some((l) => l.brandId === m.brandId))
    .sort((a, b) => scoreLeaderRank(b) - scoreLeaderRank(a));

  const global1p = brands
    .filter((b) => b.id !== selectedBrand.id)
    .map((b) => byId.get(b.id)!)
    .filter((m) => m.is1pLeader && !sameCat1p.some((l) => l.brandId === m.brandId))
    .sort((a, b) => scoreLeaderRank(b) - scoreLeaderRank(a));

  const leaderPool = [...sameCat1p, ...fallbackSameCat, ...global1p];
  const leader1 = leaderPool[0];
  const leader2 = leaderPool[1];

  // Category benchmark average across matching category (or all brands if tiny category)
  const categoryCohort =
    sameCategoryBrands.length >= 2
      ? [...sameCategoryBrands, selectedBrand].map((b) => byId.get(b.id)!)
      : allMetrics;
  const count = Math.max(1, categoryCohort.length);
  const categoryAvg: RadarBenchmarkMetrics = {
    brandId: `avg-${selectedBrand.primaryCategory}`,
    brandName: `${selectedBrand.primaryCategory} Benchmark Avg`,
    pricePoint: Math.round(categoryCohort.reduce((s, m) => s + m.pricePoint, 0) / count),
    distributionCoverage: Math.round(
      categoryCohort.reduce((s, m) => s + m.distributionCoverage, 0) / count
    ),
    marketingReach: Math.round(
      categoryCohort.reduce((s, m) => s + m.marketingReach, 0) / count
    ),
    amazon1pControl: Math.round(
      categoryCohort.reduce((s, m) => s + m.amazon1pControl, 0) / count
    ),
    brandMargin: Math.round(categoryCohort.reduce((s, m) => s + m.brandMargin, 0) / count),
    is1pLeader: false,
  };

  const peers: RadarPeerComparison['peers'] = [];

  if (mode === 'custom') {
    const customTarget =
      brands.find((b) => b.id === customPeerId && b.id !== selectedBrand.id) ||
      brands.find((b) => b.id === leader1?.brandId) ||
      brands.find((b) => b.id !== selectedBrand.id);

    if (customTarget && byId.get(customTarget.id)) {
      const m = byId.get(customTarget.id)!;
      peers.push({
        id: customTarget.id,
        label: customTarget.name,
        roleLabel: m.is1pLeader ? 'Selected Peer (1P Active)' : 'Selected Peer',
        metrics: m,
      });
    }
    peers.push({
      id: categoryAvg.brandId,
      label: categoryAvg.brandName,
      roleLabel: 'Category Mean',
      metrics: categoryAvg,
    });
  } else if (mode === 'top2-leaders') {
    if (leader1) {
      peers.push({
        id: leader1.brandId,
        label: leader1.brandName,
        roleLabel: leader1.is1pLeader ? '1P Category Leader #1' : 'Category Benchmark #1',
        metrics: leader1,
      });
    }
    if (leader2) {
      peers.push({
        id: leader2.brandId,
        label: leader2.brandName,
        roleLabel: leader2.is1pLeader ? '1P Category Leader #2' : 'Category Benchmark #2',
        metrics: leader2,
      });
    }
  } else {
    // 'leaders-avg' (Unified default)
    if (leader1) {
      peers.push({
        id: leader1.brandId,
        label: leader1.brandName,
        roleLabel: leader1.is1pLeader ? 'Top 1P Category Leader' : 'Category Leader',
        metrics: leader1,
      });
    }
    if (leader2) {
      peers.push({
        id: leader2.brandId,
        label: leader2.brandName,
        roleLabel: leader2.is1pLeader ? '1P Leader #2' : 'Peer #2',
        metrics: leader2,
      });
    }
    peers.push({
      id: categoryAvg.brandId,
      label: categoryAvg.brandName,
      roleLabel: 'Category Avg',
      metrics: categoryAvg,
    });
  }

  return {
    selected,
    peers,
    availableCustomPeers: brands
      .filter((b) => b.id !== selectedBrand.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function buildSkuPriceHistory12m(
  sku: ProductSku,
  brand?: BrandProfile,
  amazonListing?: AmazonUkListingRecord
): SkuPricePoint[] {
  if (sku.priceHistory12m && sku.priceHistory12m.length === 12) {
    return sku.priceHistory12m;
  }

  const baseRrp = Math.max(2, Number(sku.illustrativeRrpGbp) || 25);
  const baseWholesale = Math.max(1, Number(sku.illustrativeWholesaleGbp) || roundGbp(baseRrp * 0.6));
  const hasObservedPrice =
    amazonListing?.displayedPriceGbp !== null && amazonListing?.displayedPriceGbp !== undefined;
  const anchorObserved = hasObservedPrice ? Number(amazonListing!.displayedPriceGbp) : baseRrp;

  const is1pControlled =
    brand?.amazonUkPresence === 'Sold by Amazon (1P Vendor Central Active)' ||
    amazonListing?.sellerClassification === 'Amazon Vendor Central UK (1P)';
  const isPartial1p = brand?.amazonUkPresence === 'Sold by Amazon + 3P Resellers';
  const isBeerOrRtd = sku.category === 'Beer';
  const isWine = sku.category === 'Wine' || sku.category === 'Sparkling Wine';

  const seed = stableHash(`${sku.id}:${sku.name}`);
  const jitterSign = seed % 2 === 0 ? 1 : -1;

  // UK BWS 12-month retail seasonality modifiers (Dec 25 -> Nov 26)
  const seasonalRrpMods = [
    -0.03, // Dec 25 (Festive gifting promo)
    0.0,   // Jan 26 (Post-holiday reset)
    0.0,   // Feb 26
    0.0,   // Mar 26
    0.01,  // Apr 26 (Spring duty/list adjustment)
    0.0,   // May 26
    -0.01, // Jun 26 (Summer promo)
    isBeerOrRtd ? -0.02 : 0.0, // Jul 26
    isWine ? -0.01 : 0.0,      // Aug 26
    0.0,   // Sep 26
    -0.02, // Oct 26 (Pre-Q4 deal)
    0.0,   // Nov 26 (Current Target RRP anchored)
  ];

  // Observed Amazon UK channel drift curve converging onto actual observed price in Nov 26
  const endDriftRatio = baseRrp > 0 ? (anchorObserved - baseRrp) / baseRrp : 0;

  return UK_MONTHS_12.map((monthLabel, idx) => {
    const rrpFactor = idx === 11 ? 0 : seasonalRrpMods[idx];
    const targetRrpGbp = idx === 11 ? roundGbp(baseRrp) : roundGbp(baseRrp * (1 + rrpFactor));

    // Slight UK wholesale cost stability (duty/FX step in Apr if non-final, anchored in Nov 26)
    const wholesaleFactor = idx < 4 ? -0.015 : 0;
    const wholesaleCostGbp =
      idx === 11 ? roundGbp(baseWholesale) : roundGbp(baseWholesale * (1 + wholesaleFactor));

    let observedUkPriceGbp: number;
    let channelNote: string;

    if (idx === 11) {
      observedUkPriceGbp = roundGbp(anchorObserved);
      channelNote = hasObservedPrice
        ? `${amazonListing?.sellerClassification || 'Amazon UK'} spot listing`
        : 'Current target UK listing anchor';
    } else {
      const wave = Math.sin((idx + (seed % 5)) * 0.85) * jitterSign;
      if (is1pControlled) {
        // Tight 1P Buy Box discipline around Target RRP with modest Q4/Prime Day promo dips
        const promoDip = idx === 0 || idx === 6 ? -0.045 : 0;
        const delta = wave * 0.018 + promoDip + endDriftRatio * (idx / 11);
        observedUkPriceGbp = roundGbp(targetRrpGbp * (1 + delta));
        channelNote =
          promoDip < 0
            ? '1P Seasonal Event / Promo'
            : '1P Buy Box RRP Discipline';
      } else if (isPartial1p) {
        const delta = wave * 0.05 + (endDriftRatio || -0.03) * ((idx + 3) / 14);
        observedUkPriceGbp = roundGbp(targetRrpGbp * (1 + delta));
        channelNote =
          delta < -0.04
            ? '3P Reseller Undercut Pressure'
            : 'Mixed 1P / 3P Buy Box';
      } else {
        // 3P-only or fragmented: wider swing (either grey undercutting or scarce-stock markup)
        const baselineBias = hasObservedPrice ? endDriftRatio : (seed % 3 === 0 ? 0.08 : -0.07);
        const delta = baselineBias * (0.65 + (idx / 11) * 0.35) + wave * 0.075;
        observedUkPriceGbp = roundGbp(Math.max(wholesaleCostGbp * 1.12, targetRrpGbp * (1 + delta)));
        channelNote =
          observedUkPriceGbp > targetRrpGbp * 1.04
            ? '3P Scarcity Markup Above RRP'
            : observedUkPriceGbp < targetRrpGbp * 0.94
            ? '3P Grey-Market Price Erosion'
            : 'Fragmented 3P Offer';
      }
    }

    return {
      monthLabel,
      observedUkPriceGbp,
      targetRrpGbp,
      wholesaleCostGbp,
      channelNote,
    };
  });
}

export function computeMutualBenefitAnalysis(
  brand: BrandProfile,
  skus: ProductSku[],
  amazonListings: AmazonUkListingRecord[],
  ukDistributions: UkDistributionRecord[],
  opportunityAssessments: OpportunityAssessmentRecord[]
): MutualBenefitAnalysis {
  const brandSkus = skus.filter((s) => s.brandId === brand.id);
  const primarySku = brandSkus[0];
  const listing = amazonListings.find((a) => a.brandId === brand.id);
  const ukDist = ukDistributions.find((u) => u.brandId === brand.id);
  const opp = opportunityAssessments.find((o) => o.brandId === brand.id);

  const targetRrp = primarySku?.illustrativeRrpGbp || listing?.displayedPriceGbp || 26;
  const wholesaleCost =
    primarySku?.illustrativeWholesaleGbp || roundGbp(targetRrp * 0.62);
  const observedPrice = listing?.displayedPriceGbp ?? targetRrp;

  const pricingDriftGbp = roundGbp(observedPrice - targetRrp);
  const signedDriftGbp = Math.round((observedPrice - targetRrp) * 100) / 100;
  const pricingDriftPct = targetRrp > 0 ? Math.round(((observedPrice - targetRrp) / targetRrp) * 100) : 0;

  const wholesaleMarginPerUnitGbp = Math.round((targetRrp - wholesaleCost) * 100) / 100;
  const wholesaleMarginPct =
    targetRrp > 0 ? Math.round((wholesaleMarginPerUnitGbp / targetRrp) * 100) : 36;

  // Brand-name-agnostic Objective Partner Fit Score (0-100)
  const isNoSoldByAmazon = brand.amazonUkPresence.includes("No 'Sold by Amazon'");
  const isPartial1p = brand.amazonUkPresence === 'Sold by Amazon + 3P Resellers';

  // 1. 1P Buy Box Whitespace (up to 32 pts)
  const buyBoxGapPts = isNoSoldByAmazon ? 32 : isPartial1p ? 20 : 9;

  // 2. 3P Pricing Drift Urgency (up to 16 pts)
  const absDriftRatio = Math.min(0.35, Math.abs(signedDriftGbp) / Math.max(1, targetRrp));
  const driftUrgencyPts = isNoSoldByAmazon
    ? 8 + Math.round(absDriftRatio * 23)
    : Math.round(absDriftRatio * 18);

  // 3. Wholesale-to-RRP 1P Margin Headroom (up to 22 pts)
  const marginFitPts =
    wholesaleMarginPct >= 40
      ? 22
      : wholesaleMarginPct >= 34
      ? 19
      : wholesaleMarginPct >= 28
      ? 15
      : 10;

  // 4. Content & Range Expansion Upside (up to 16 pts)
  let contentGapPts = 10;
  if (listing?.listingQualityScore === 'Unclaimed') contentGapPts = 16;
  else if (listing?.listingQualityScore === 'Poor (Duplicate / Incomplete)') contentGapPts = 15;
  else if (listing?.listingQualityScore === 'Moderate (Basic Images)') contentGapPts = 12;
  else if (listing?.listingQualityScore === 'Strong (A+ & Brand Registry)') contentGapPts = 6;

  if (listing && listing.rangeCoveragePct < 45) {
    contentGapPts = Math.min(16, contentGapPts + 3);
  }

  // 5. UK Channel & Export Readiness (up to 14 pts)
  let logisticsFitPts = 10;
  if (
    brand.ukArrangementType === 'None Confirmed' ||
    brand.ukArrangementType === 'Unverified / Grey Channel' ||
    brand.ukArrangementType === 'Unknown'
  ) {
    logisticsFitPts = 14;
  } else if (brand.ukArrangementType === 'Non-Exclusive (Verified)') {
    logisticsFitPts = 12;
  } else if (brand.ukArrangementType === 'Exclusive (Verified)') {
    logisticsFitPts = 8;
  }

  const objectiveFitScore = Math.max(
    25,
    Math.min(
      98,
      buyBoxGapPts + driftUrgencyPts + marginFitPts + contentGapPts + logisticsFitPts
    )
  );

  let fitTier: MutualBenefitAnalysis['fitTier'] = 'Selective 1P Expansion';
  if (!isNoSoldByAmazon && !isPartial1p) fitTier = 'Existing 1P Steward';
  else if (objectiveFitScore >= 78) fitTier = 'Prime 1P Partner Fit';
  else if (objectiveFitScore >= 64) fitTier = 'Strong 1P Candidate';

  // Recommended UK 1P Logistics Pathway
  const abvNum = parseFloat(primarySku?.abv || '14');
  const isHighExciseSpirit = abvNum >= 20;
  const recommendedLogisticsPathway = isHighExciseSpirit
    ? '3P Wet-Bond (EHD London / Seabrook) -> WePrep Duty-Paid 1P ASN'
    : brand.countryId === 'za' || brand.countryId === 'au' || brand.countryId === 'ar' || brand.countryId === 'cl'
    ? 'UK Container / Wet-Bond Intake -> WePrep Vendor Central 1P'
    : 'DHL UK Credit Direct-Ship or WePrep Duty-Paid 1P Prep';

  const absDriftFormatted = `£${Math.abs(signedDriftGbp).toFixed(2)}`;
  const driftDirectionText =
    signedDriftGbp > 0.4
      ? `3P resellers currently list at £${observedPrice.toFixed(2)} (+${Math.abs(
          pricingDriftPct
        )}% above £${targetRrp.toFixed(2)} RRP), suppressing conversion`
      : signedDriftGbp < -0.4
      ? `3P resellers undercut RRP by ${absDriftFormatted} (${Math.abs(
          pricingDriftPct
        )}% below £${targetRrp.toFixed(2)}), eroding trade pricing`
      : `Anchor 1P Buy Box discipline around £${targetRrp.toFixed(2)} target RRP`;

  const rangeGapPct = listing ? Math.max(0, 100 - listing.rangeCoveragePct) : 60;
  const estimatedAnnual1pPoGbp = brand.illustrativePipelineValueGbp;

  const brandGains: MutualBenefitAnalysis['brandGains'] = {
    headline: isNoSoldByAmazon
      ? `Replace fragmented 3P resellers with unified "Dispatched from and sold by Amazon" 1P stewardship`
      : `Expand authorised 1P SKU coverage (+${rangeGapPct}% missing range) & ring-fence Buy Box pricing`,
    priceIntegrityRecovery: driftDirectionText,
    channelAndLogisticsWin: `Zero FBA seller fees or UK VAT/AWRS setup burden — Mercenta buys wholesale into UK 1P Vendor Central via ${recommendedLogisticsPathway}.`,
    conversionAndAPlusWin: listing
      ? `Upgrade "${listing.listingQualityScore}" listings across ${listing.totalBrandListings} ASINs to Brand Registry A+ Content, Subscribe & Save, and ASA/CAP 18+ Amazon Ads.`
      : `Build clean UK Vendor Central catalogue pages with A+ Brand Story and compliant 18+ Amazon Ads.`,
    distributorCoexistence:
      ukDist && ukDist.organisation
        ? `Complements existing UK trade partner (${ukDist.organisation}) by ring-fencing Amazon.co.uk 1P wholesale without disrupting on-trade hospitality listings.`
        : `Establishes clean UK e-commerce stewardship alongside traditional retail/hospitality importers.`,
  };

  const mercentaGains: MutualBenefitAnalysis['mercentaGains'] = {
    headline: `Capture £${wholesaleMarginPerUnitGbp.toFixed(
      2
    )}/unit (${wholesaleMarginPct}%) gross RRP-to-1P spread across ${brand.primaryCategory}`,
    marginSpreadSummary: `1P cost £${wholesaleCost.toFixed(
      2
    )} vs £${targetRrp.toFixed(2)} UK RRP yields £${wholesaleMarginPerUnitGbp.toFixed(
      2
    )}/unit (${wholesaleMarginPct}%) retail headroom to fund Amazon 1P co-op & delivery.`,
    poVolumeSummary: `Projected £${estimatedAnnual1pPoGbp.toLocaleString()}/yr repeat Vendor Central PO flow across ${Math.max(
      1,
      brandSkus.length
    )} core SKU(s) with zero FBA storage risk.`,
    categoryWhitespaceSummary:
      opp?.overallScore
        ? `Adds a ${opp.overallScore}/100 rated ${brand.countryName} ${brand.primaryCategory} producer with existing search demand and proven export packaging.`
        : `Fills high-intent ${brand.primaryCategory} (${brand.countryName}) shelf whitespace on Amazon.co.uk.`,
  };

  const mutualVerdict = isNoSoldByAmazon
    ? `Mutual Fit ${objectiveFitScore}/100: ${brand.name} regains Amazon.co.uk Buy Box pricing discipline and zero-FBA wholesale PO certainty, while Mercenta captures a ${wholesaleMarginPct}% margin spread (£${estimatedAnnual1pPoGbp.toLocaleString()}/yr PO upside) in ${brand.primaryCategory}.`
    : `Mutual Fit ${objectiveFitScore}/100: ${brand.name} unlocks ${rangeGapPct}% unlisted UK range expansion and 3P leakage control, while Mercenta adds recurring ${brand.primaryCategory} 1P PO volume at ${wholesaleMarginPct}% gross RRP spread.`;

  return {
    brandId: brand.id,
    objectiveFitScore,
    fitTier,
    recommendedLogisticsPathway,
    pricingDriftGbp: signedDriftGbp,
    pricingDriftPct,
    wholesaleMarginPerUnitGbp,
    wholesaleMarginPct,
    estimatedAnnual1pPoGbp,
    brandGains,
    mercentaGains,
    mutualVerdict,
  };
}
