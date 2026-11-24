import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  LineChart,
  Package,
  PackagePlus,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Truck,
  Upload,
  UserCheck,
  Warehouse,
} from 'lucide-react';
import {
  AMAZON_UK_LISTINGS,
  BRANDS,
  PARTNER_ACCOUNTS,
  PARTNER_AMAZON_DASHBOARDS,
  WET_BOND_PARTNERS,
} from '../../data/bwsData';
import { SkuPriceHistoryChart } from '../charts/BenchmarkAndPriceCharts';
import {
  BrandProfile,
  DrinkCategory,
  FulfilmentPathway,
  PartnerAmazonDashboardData,
  PartnerAsinMetric,
  PartnerCampaignMetric,
  PartnerDailyPoint,
  PartnerTimeframe,
  ProductSku,
  VendorCentralPoRecord,
} from '../../types/bws';
import { ALL_DRINK_CATEGORIES } from '../ui/MultiSelectCategoryFilter';
import {
  MetricStrip,
  ProductVisual,
  PrototypeBannerNote,
  SectionHeader,
} from '../ui/SharedPrimitives';

type PortalTab = 'dashboard' | 'pos' | 'skus';

function addDaysIso(isoDate: string, deltaDays: number): string {
  const dt = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return isoDate;
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

const PATHWAY_OPTIONS: {
  id: FulfilmentPathway;
  title: string;
  subtitle: string;
  detail: string;
}[] = [
  {
    id: 'direct_ship_dhl',
    title: 'Direct-Ship via Mercenta DHL Credit Account',
    subtitle: 'Mercenta Account #MER-DHL-UK-8841 · 3–14 Day Lead Time',
    detail:
      'Dispatch directly from your distillery/winery to Amazon UK FC or WePrep using Mercenta’s prepaid DHL credit waybill & GB EORI customs clearance.',
  },
  {
    id: 'weprep_duty_paid',
    title: 'WePrep UK (Ipswich · Non-Bonded Duty-Paid 1P Prep)',
    subtitle: 'Duty-Paid Stock Only · Vendor Central ASN & SSCC Pallets',
    detail:
      'Use when duty is already paid (UK domestic distiller or cleared stock). WePrep handles Amazon Vendor Central UK carton labelling, ASN booking & FC delivery.',
  },
  {
    id: 'third_party_wet_bond',
    title: '3P Wet-Bond Partner → Duty-Paid Release to WePrep',
    subtitle: 'EHD London No. 1 Bond / Seabrook / LCB (Excise Suspended)',
    detail:
      'Store bulk duty-suspended EU/RoW stock in HMRC-approved wet bond under Mercenta UKWA cover, calling off duty-paid cases to WePrep as Vendor Central POs arrive.',
  },
];

const TIMEFRAME_FACTORS: Record<
  PartnerTimeframe,
  { label: string; mult: number; pointLabels: string[] }
> = {
  '7d': {
    label: 'Last 7 Days',
    mult: 0.26,
    pointLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  '30d': {
    label: 'Last 30 Days',
    mult: 1,
    pointLabels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
  },
  '90d': {
    label: 'Last 90 Days',
    mult: 2.85,
    pointLabels: ['Month 1', 'Month 2', 'Month 3'],
  },
  ytd: {
    label: 'Year to Date',
    mult: 8.4,
    pointLabels: ['Q1', 'Q2', 'Q3', 'Q4 (MTD)'],
  },
};

function buildFallbackDashboard(
  brand: BrandProfile,
  brandSkus: ProductSku[]
): PartnerAmazonDashboardData {
  const baseMonthly = Math.max(Math.round(brand.illustrativePipelineValueGbp / 12), 14000);
  const firstSku = brandSkus[0];
  const unitPrice = firstSku?.illustrativeRrpGbp || 32;
  const totalUnits = Math.max(Math.round(baseMonthly / unitPrice), 180);
  const vendorCode = `UK-VC-${brand.id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()} (1P)`;

  const weights = [0.21, 0.24, 0.26, 0.29];
  const series30d: PartnerDailyPoint[] = weights.map((w, idx) => {
    const totalSalesGbp = Math.round(baseMonthly * w);
    const adSalesGbp = Math.round(totalSalesGbp * (0.31 + idx * 0.015));
    const adSpendGbp = Math.round(adSalesGbp * (0.165 - idx * 0.005));
    const orderedUnits = Math.round(totalUnits * w);
    return {
      label: `Wk ${idx + 1}`,
      totalSalesGbp,
      adSalesGbp,
      adSpendGbp,
      orderedUnits,
    };
  });

  const asinMetrics: PartnerAsinMetric[] = (brandSkus.length > 0 ? brandSkus : []).slice(0, 3).map((s, idx) => {
    const share = idx === 0 ? 0.65 : idx === 1 ? 0.25 : 0.1;
    const rev = Math.round(baseMonthly * (brandSkus.length === 1 ? 1 : share));
    const units = Math.max(Math.round(rev / (s.illustrativeRrpGbp || 32)), 40);
    const glanceViews = Math.round(units * (13.8 + idx));
    const adSalesGbp = Math.round(rev * 0.33);
    const adSpendGbp = Math.round(adSalesGbp * 0.16);
    return {
      asin: `B0${brand.id.slice(0, 3).toUpperCase()}${idx + 1}UK1P`,
      skuName: s.name,
      shippedRevenueGbp: rev,
      orderedUnits: units,
      glanceViews,
      conversionPct: Number(((units / Math.max(glanceViews, 1)) * 100).toFixed(2)),
      adSpendGbp,
      adSalesGbp,
      buyBoxPct: 94.5 - idx * 1.2,
    };
  });

  if (asinMetrics.length === 0) {
    asinMetrics.push({
      asin: `B0${brand.id.slice(0, 4).toUpperCase()}UK1P`,
      skuName: `${brand.name} Core UK Pack`,
      shippedRevenueGbp: baseMonthly,
      orderedUnits: totalUnits,
      glanceViews: totalUnits * 14,
      conversionPct: 7.14,
      adSpendGbp: Math.round(baseMonthly * 0.33 * 0.16),
      adSalesGbp: Math.round(baseMonthly * 0.33),
      buyBoxPct: 95.0,
    });
  }

  const totalAdSales = series30d.reduce((a, b) => a + b.adSalesGbp, 0);
  const totalAdSpend = series30d.reduce((a, b) => a + b.adSpendGbp, 0);

  const campaigns: PartnerCampaignMetric[] = [
    {
      id: `cmp-${brand.id}-sp`,
      campaignName: `SP | ${brand.name} Core ${brand.primaryCategory} Exact (18+)`,
      formatLabel: 'Sponsored Products',
      channelLabel: 'Amazon Store',
      status: 'Delivering',
      impressions: Math.round(totalAdSpend * 44),
      clicks: Math.round(totalAdSpend * 0.62),
      spendGbp: Math.round(totalAdSpend * 0.6),
      salesGbp: Math.round(totalAdSales * 0.64),
    },
    {
      id: `cmp-${brand.id}-sb`,
      campaignName: `SB | ${brand.countryName} Provenance Store Spotlight`,
      formatLabel: 'Sponsored Brands',
      channelLabel: 'Amazon Store + DSP',
      status: 'Delivering',
      impressions: Math.round(totalAdSpend * 38),
      clicks: Math.round(totalAdSpend * 0.34),
      spendGbp: Math.round(totalAdSpend * 0.4),
      salesGbp: Math.round(totalAdSales * 0.36),
    },
  ];

  return {
    brandId: brand.id,
    vendorCode,
    dataSourceLabel: 'Illustrative Amazon Vendor Central UK (1P) & Ads Benchmark',
    buyBoxWinPct: 95.2,
    series30d,
    asinMetrics,
    campaigns,
  };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseAmazonPartnerCsv(
  csvText: string,
  fileName: string,
  brand: BrandProfile
): PartnerAmazonDashboardData | null {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const findCol = (candidates: string[]) =>
    headers.findIndex((h) => candidates.some((c) => h.includes(c)));

  const idxLabel = findCol(['date', 'week', 'period', 'month']);
  const idxAsin = findCol(['asin']);
  const idxSku = findCol(['sku', 'product', 'title', 'name']);
  const idxSales = findCol(['shipped_revenue', 'total_sales', 'ordered_revenue', 'revenue', 'sales']);
  const idxUnits = findCol(['ordered_units', 'shipped_units', 'units']);
  const idxViews = findCol(['glance_views', 'views', 'sessions']);
  const idxSpend = findCol(['ad_spend', 'spend', 'cost']);
  const idxAdSales = findCol(['ad_sales', 'attributed_sales', 'ppc_sales']);
  const idxBuyBox = findCol(['buy_box', 'buybox']);
  const idxImpr = findCol(['impressions']);
  const idxClicks = findCol(['clicks']);

  const byLabel = new Map<string, PartnerDailyPoint>();
  const byAsin = new Map<string, PartnerAsinMetric>();
  let totalImpr = 0;
  let totalClicks = 0;

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);
    if (cols.length === 0) continue;
    const num = (idx: number) => {
      if (idx < 0 || idx >= cols.length) return 0;
      const cleaned = cols[idx].replace(/[£$€,%]/g, '').trim();
      const val = Number.parseFloat(cleaned);
      return Number.isFinite(val) ? val : 0;
    };

    const label = idxLabel >= 0 && cols[idxLabel] ? cols[idxLabel] : `Row ${r}`;
    const asin = idxAsin >= 0 && cols[idxAsin] ? cols[idxAsin] : `CSV-ASIN-${r}`;
    const skuName = idxSku >= 0 && cols[idxSku] ? cols[idxSku] : `${brand.name} SKU ${r}`;
    const sales = num(idxSales);
    const units = Math.round(num(idxUnits));
    const views = Math.round(num(idxViews)) || Math.round(units * 13.5);
    const spend = num(idxSpend);
    const adSales = num(idxAdSales) || Math.round(sales * 0.32);
    const buyBox = num(idxBuyBox) || 96.0;
    totalImpr += Math.round(num(idxImpr)) || Math.round(spend * 48);
    totalClicks += Math.round(num(idxClicks)) || Math.round(spend * 0.65);

    const prevPoint = byLabel.get(label) || {
      label,
      totalSalesGbp: 0,
      adSalesGbp: 0,
      adSpendGbp: 0,
      orderedUnits: 0,
    };
    prevPoint.totalSalesGbp += sales;
    prevPoint.adSalesGbp += adSales;
    prevPoint.adSpendGbp += spend;
    prevPoint.orderedUnits += units;
    byLabel.set(label, prevPoint);

    const prevAsin = byAsin.get(asin) || {
      asin,
      skuName,
      shippedRevenueGbp: 0,
      orderedUnits: 0,
      glanceViews: 0,
      conversionPct: 0,
      adSpendGbp: 0,
      adSalesGbp: 0,
      buyBoxPct: buyBox,
    };
    prevAsin.shippedRevenueGbp += sales;
    prevAsin.orderedUnits += units;
    prevAsin.glanceViews += views;
    prevAsin.adSpendGbp += spend;
    prevAsin.adSalesGbp += adSales;
    prevAsin.conversionPct = Number(
      ((prevAsin.orderedUnits / Math.max(prevAsin.glanceViews, 1)) * 100).toFixed(2)
    );
    byAsin.set(asin, prevAsin);
  }

  const series30d = Array.from(byLabel.values()).slice(0, 12);
  const asinMetrics = Array.from(byAsin.values());
  if (series30d.length === 0 || asinMetrics.length === 0) return null;

  const avgBuyBox =
    asinMetrics.reduce((acc, a) => acc + a.buyBoxPct, 0) / Math.max(asinMetrics.length, 1);
  const totalSpend = series30d.reduce((acc, p) => acc + p.adSpendGbp, 0);
  const totalAdSales = series30d.reduce((acc, p) => acc + p.adSalesGbp, 0);

  return {
    brandId: brand.id,
    vendorCode: `CSV IMPORT (${fileName})`,
    dataSourceLabel: `Live Uploaded CSV Data — ${fileName} (${lines.length - 1} rows)`,
    buyBoxWinPct: Number(avgBuyBox.toFixed(1)),
    series30d,
    asinMetrics,
    campaigns: [
      {
        id: 'csv-imported-agg',
        campaignName: `Imported Amazon Ads Aggregate (${fileName})`,
        formatLabel: 'Sponsored Products + Brands',
        channelLabel: 'Amazon Store UK',
        status: 'Delivering',
        impressions: totalImpr,
        clicks: totalClicks,
        spendGbp: Math.round(totalSpend),
        salesGbp: Math.round(totalAdSales),
      },
    ],
  };
}

export const PartnerPortalView: React.FC<{
  brands?: BrandProfile[];
  skus: ProductSku[];
  onUpdateSku: (updated: ProductSku) => void;
  onAddSku: (created: ProductSku) => void;
  vendorCentralPos: VendorCentralPoRecord[];
  onUpdatePo: (updated: VendorCentralPoRecord) => void;
}> = ({ brands = BRANDS, skus, onUpdateSku, onAddSku, vendorCentralPos, onUpdatePo }) => {
  const [activePartnerBrandId, setActivePartnerBrandId] = useState<string>(
    PARTNER_ACCOUNTS[0].brandId
  );
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [timeframe, setTimeframe] = useState<PartnerTimeframe>('30d');

  const [csvDashboards, setCsvDashboards] = useState<Record<string, PartnerAmazonDashboardData>>(
    () => {
      try {
        const raw = window.localStorage.getItem('mercenta_partner_csv_dashboards_v1');
        return raw ? (JSON.parse(raw) as Record<string, PartnerAmazonDashboardData>) : {};
      } catch {
        return {};
      }
    }
  );
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_partner_csv_dashboards_v1', JSON.stringify(csvDashboards));
    } catch {
      // ignore storage quota errors
    }
  }, [csvDashboards]);

  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ProductSku | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedPriceSkuIds, setExpandedPriceSkuIds] = useState<Record<string, boolean>>({});

  const [newSkuName, setNewSkuName] = useState('');
  const [newSkuCategory, setNewSkuCategory] = useState<DrinkCategory>('Whisky & Whiskey');
  const [newSkuType, setNewSkuType] = useState('Single Malt / Estate Reserve');
  const [newSkuSize, setNewSkuSize] = useState('700ml');
  const [newSkuAbv, setNewSkuAbv] = useState('43.0%');
  const [newSkuPack, setNewSkuPack] = useState('6 × 700ml Case');
  const [newSkuWholesale, setNewSkuWholesale] = useState('24.50');
  const [newSkuRrp, setNewSkuRrp] = useState('42.00');
  const [newSkuNotes, setNewSkuNotes] = useState('');
  const [newSkuImage, setNewSkuImage] = useState('');

  const brandProfile = brands.find((b) => b.id === activePartnerBrandId) || brands[0];
  const account = PARTNER_ACCOUNTS.find((a) => a.brandId === brandProfile.id) || {
    brandId: brandProfile.id,
    brandName: brandProfile.name,
    portalEmail: `partner-uk@${brandProfile.website}`,
    mercentaAccountManager: 'Oliver Bennett',
    accountManagerEmail: 'oliver.bennett@mercenta.co.uk',
    dhlAccountNumber: 'MER-DHL-UK-8841 (Net-30 Credit Terms)',
    mercentaEori: 'GB 419 8820 11 000',
    mercentaAwrsUrn: 'XMAW00000109482 (Applied / Illustrative)',
    defaultPathway: 'direct_ship_dhl' as FulfilmentPathway,
    defaultLeadTimeDays: 7,
    wetBondPartnerName: 'EHD London No. 1 Bond',
  };

  const brandSkus = useMemo(
    () => skus.filter((s) => s.brandId === brandProfile.id),
    [skus, brandProfile.id]
  );

  const brandPos = useMemo(
    () => vendorCentralPos.filter((po) => po.brandId === brandProfile.id),
    [vendorCentralPos, brandProfile.id]
  );

  const isCsvLoaded = Boolean(csvDashboards[brandProfile.id]);
  const rawDashboard: PartnerAmazonDashboardData = useMemo(() => {
    if (csvDashboards[brandProfile.id]) return csvDashboards[brandProfile.id];
    if (PARTNER_AMAZON_DASHBOARDS[brandProfile.id]) return PARTNER_AMAZON_DASHBOARDS[brandProfile.id];
    return buildFallbackDashboard(brandProfile, brandSkus);
  }, [csvDashboards, brandProfile, brandSkus]);

  // Scale metrics cleanly across 7d / 30d / 90d / ytd
  const scaledView = useMemo(() => {
    const tf = TIMEFRAME_FACTORS[timeframe];
    const mult = isCsvLoaded && timeframe === '30d' ? 1 : tf.mult;

    const baseSeries = rawDashboard.series30d;
    const baseTotalSales = baseSeries.reduce((a, b) => a + b.totalSalesGbp, 0);
    const baseAdSales = baseSeries.reduce((a, b) => a + b.adSalesGbp, 0);
    const baseAdSpend = baseSeries.reduce((a, b) => a + b.adSpendGbp, 0);
    const baseUnits = baseSeries.reduce((a, b) => a + b.orderedUnits, 0);

    const totalSalesGbp = Math.round(baseTotalSales * mult);
    const adSalesGbp = Math.round(baseAdSales * mult);
    const adSpendGbp = Math.round(baseAdSpend * mult);
    const orderedUnits = Math.round(baseUnits * mult);

    const glanceViews = Math.round(
      rawDashboard.asinMetrics.reduce((a, m) => a + m.glanceViews, 0) * mult
    );
    const conversionPct = glanceViews > 0 ? (orderedUnits / glanceViews) * 100 : 0;
    const acosPct = adSalesGbp > 0 ? (adSpendGbp / adSalesGbp) * 100 : 0;
    const tacosPct = totalSalesGbp > 0 ? (adSpendGbp / totalSalesGbp) * 100 : 0;
    const roas = adSpendGbp > 0 ? adSalesGbp / adSpendGbp : 0;

    // Build chart series matching timeframe labels (or raw CSV rows for 30d)
    const chartPoints: PartnerDailyPoint[] =
      isCsvLoaded || timeframe === '30d'
        ? baseSeries
        : tf.pointLabels.map((lbl, idx) => {
            const count = tf.pointLabels.length;
            const trend = 0.86 + (idx / Math.max(count - 1, 1)) * 0.28;
            const share = (1 / count) * trend;
            return {
              label: lbl,
              totalSalesGbp: Math.round(totalSalesGbp * share),
              adSalesGbp: Math.round(adSalesGbp * share),
              adSpendGbp: Math.round(adSpendGbp * share),
              orderedUnits: Math.round(orderedUnits * share),
            };
          });

    const asins = rawDashboard.asinMetrics.map((m) => ({
      ...m,
      shippedRevenueGbp: Math.round(m.shippedRevenueGbp * mult),
      orderedUnits: Math.round(m.orderedUnits * mult),
      glanceViews: Math.round(m.glanceViews * mult),
      adSpendGbp: Math.round(m.adSpendGbp * mult),
      adSalesGbp: Math.round(m.adSalesGbp * mult),
    }));

    const campaigns = rawDashboard.campaigns.map((c) => ({
      ...c,
      impressions: Math.round(c.impressions * mult),
      clicks: Math.round(c.clicks * mult),
      spendGbp: Math.round(c.spendGbp * mult),
      salesGbp: Math.round(c.salesGbp * mult),
    }));

    return {
      totalSalesGbp,
      adSalesGbp,
      adSpendGbp,
      orderedUnits,
      orderedCases: Math.max(Math.round(orderedUnits / 6), 1),
      glanceViews,
      conversionPct,
      acosPct,
      tacosPct,
      roas,
      buyBoxWinPct: rawDashboard.buyBoxWinPct,
      chartPoints,
      asins,
      campaigns,
    };
  }, [rawDashboard, timeframe, isCsvLoaded]);

  const handleCsvUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const parsed = parseAmazonPartnerCsv(reader.result, file.name, brandProfile);
      if (!parsed) {
        setCsvFeedback(
          'Could not parse CSV columns. Ensure headers include Date/Week, ASIN, Revenue/Sales, Units, Ad Spend, Ad Sales.'
        );
        return;
      }
      setCsvDashboards((prev) => ({ ...prev, [brandProfile.id]: parsed }));
      setCsvFeedback(`Loaded ${file.name} into ${brandProfile.name} Amazon 1P & Ads Dashboard.`);
      setTimeout(() => setCsvFeedback(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const header = 'Week,ASIN,SKU,Shipped_Revenue_GBP,Ordered_Units,Glance_Views,Ad_Spend_GBP,Ad_Sales_GBP,Buy_Box_Pct';
    const sampleRows = rawDashboard.asinMetrics.map((m, i) =>
      `Wk ${i + 1},${m.asin},"${m.skuName}",${m.shippedRevenueGbp},${m.orderedUnits},${m.glanceViews},${m.adSpendGbp},${m.adSalesGbp},${m.buyBoxPct}`
    );
    const blob = new Blob([[header, ...sampleRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brandProfile.id}-amazon-1p-ads-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImageFileUpload = (
    file: File | undefined,
    onLoaded: (dataUrl: string) => void
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoaded(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartEdit = (sku: ProductSku) => {
    setEditingSkuId(sku.id);
    setEditDraft({ ...sku });
  };

  const handleSaveEdit = () => {
    if (!editDraft) return;
    onUpdateSku(editDraft);
    setEditingSkuId(null);
    setEditDraft(null);
  };

  const handleCreateSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkuName.trim()) return;
    const fallbackImg = brandSkus[0]?.imageUrl || skus[0]?.imageUrl || '';
    const created: ProductSku = {
      id: `sku-partner-${Date.now()}`,
      brandId: brandProfile.id,
      brandName: brandProfile.name,
      countryId: brandProfile.countryId,
      countryName: brandProfile.countryName,
      name: newSkuName.trim(),
      category: newSkuCategory,
      productType: newSkuType.trim() || newSkuCategory,
      bottleSize: newSkuSize.trim() || '700ml',
      abv: newSkuAbv.trim() || '40.0%',
      packFormat: newSkuPack.trim() || '6 × 700ml Case',
      packagingInfo: 'Partner-submitted bottle & case specification for Amazon Vendor Central UK (1P)',
      tastingNotes: newSkuNotes.trim() || 'Awaiting partner tasting note confirmation.',
      imageUrl: newSkuImage || fallbackImg,
      status: 'Active Portfolio',
      illustrativeWholesaleGbp: Number.parseFloat(newSkuWholesale) || 22.0,
      illustrativeRrpGbp: Number.parseFloat(newSkuRrp) || 38.0,
    };
    onAddSku(created);
    setNewSkuName('');
    setNewSkuNotes('');
    setNewSkuImage('');
    setShowAddForm(false);
  };

  const partnerBrandIds = new Set(PARTNER_ACCOUNTS.map((a) => a.brandId));
  const otherBrands = brands.filter((b) => !partnerBrandIds.has(b.id));
  const maxChartSales = Math.max(...scaledView.chartPoints.map((p) => p.totalSalesGbp), 1);

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Partner Portal · Amazon Vendor Central UK (1P)"
        title="Brand Partner Portal & Amazon 1P Performance"
        description="Brand-facing workspace combining live Amazon Vendor Central UK (1P) sales, ACOS, TACoS, ROAS & Buy Box analytics with 1P PO fulfilment routing (DHL Credit / WePrep / Wet-Bond) and synced bottle specs."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Partner Brand View:
            </label>
            <select
              value={brandProfile.id}
              onChange={(e) => {
                setActivePartnerBrandId(e.target.value);
                setEditingSkuId(null);
                setEditDraft(null);
                setCsvFeedback(null);
              }}
              aria-label="Switch partner brand account"
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
            >
              <optgroup label="Active Partner Accounts (1P)">
                {PARTNER_ACCOUNTS.map((acc) => (
                  <option key={acc.brandId} value={acc.brandId}>
                    {acc.brandName} ({acc.portalEmail})
                  </option>
                ))}
              </optgroup>
              <optgroup label={`Directory Brands Preview (${otherBrands.length})`}>
                {otherBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.countryName}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        }
      />

      {/* 3 Clean Portal Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex flex-wrap border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-black text-black dark:text-white'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Amazon 1P & Ads Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-white dark:bg-black text-black dark:text-white'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>POs & Direct-Ship Routing ({brandPos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skus')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer ${
              activeTab === 'skus'
                ? 'bg-white dark:bg-black text-black dark:text-white'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>SKU Specs & Bottle Media ({brandSkus.length})</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          Vendor Code: <strong className="text-black dark:text-white">{rawDashboard.vendorCode}</strong>
        </div>
      </div>

      {/* =====================================================================
       * TAB 1: AMAZON 1P & ADS PERFORMANCE DASHBOARD
       * =================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Honest Benchmark vs Real CSV / API Bar */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold ${
                    isCsvLoaded ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#FF6A00]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{rawDashboard.dataSourceLabel}</span>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  Amazon SP-API & Ads API Ready (OAuth Post-Build)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Inspect {brandProfile.name}’s Vendor Central UK (1P) shipped revenue, ACOS, TACoS, ROAS & ASIN conversion—or upload a real Vendor Central / Amazon Ads CSV export.
              </p>
              {csvFeedback && (
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {csvFeedback}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Timeframe Switcher */}
              <div className="flex border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
                {(['7d', '30d', '90d', 'ytd'] as PartnerTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1.5 text-[11px] font-mono font-semibold uppercase cursor-pointer ${
                      timeframe === tf
                        ? 'bg-white dark:bg-black text-[#FF6A00]'
                        : 'text-zinc-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:border-[#FF6A00] text-black dark:text-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Sample CSV</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white cursor-pointer">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Vendor Central / Ads CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    handleCsvUpload(e.target.files?.[0]);
                    e.currentTarget.value = '';
                  }}
                />
              </label>

              {isCsvLoaded && (
                <button
                  type="button"
                  onClick={() => {
                    setCsvDashboards((prev) => {
                      const next = { ...prev };
                      delete next[brandProfile.id];
                      return next;
                    });
                    setCsvFeedback('Restored illustrative Amazon 1P & Ads benchmark.');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 hover:border-red-500 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* 8 Executive Amazon 1P & Ads KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
            {[
              {
                label: `1P Shipped Revenue (${timeframe.toUpperCase()})`,
                value: `£${scaledView.totalSalesGbp.toLocaleString()}`,
                detail: `${TIMEFRAME_FACTORS[timeframe].label} · Sold by Amazon 1P`,
                highlight: true,
              },
              {
                label: 'Ordered Units & Cases',
                value: `${scaledView.orderedUnits.toLocaleString()} units`,
                detail: `~${scaledView.orderedCases.toLocaleString()} 6-pack cases`,
              },
              {
                label: 'Amazon Ad Spend',
                value: `£${scaledView.adSpendGbp.toLocaleString()}`,
                detail: 'Sponsored Products, Brands & DSP',
              },
              {
                label: 'Ad-Attributed Sales',
                value: `£${scaledView.adSalesGbp.toLocaleString()}`,
                detail: `${Math.round((scaledView.adSalesGbp / Math.max(scaledView.totalSalesGbp, 1)) * 100)}% of total 1P sales`,
                highlight: true,
              },
              {
                label: 'ACOS %',
                value: `${scaledView.acosPct.toFixed(1)}%`,
                detail: 'Ad Spend ÷ Ad Sales (Target < 18%)',
                highlight: true,
              },
              {
                label: 'TACoS %',
                value: `${scaledView.tacosPct.toFixed(1)}%`,
                detail: 'Ad Spend ÷ Total 1P Revenue (Target < 7%)',
              },
              {
                label: 'Blended ROAS',
                value: `${scaledView.roas.toFixed(2)}×`,
                detail: `£${scaledView.roas.toFixed(2)} return per £1 ad spend`,
              },
              {
                label: 'Glance Views · Conv % · Buy Box',
                value: `${scaledView.buyBoxWinPct.toFixed(1)}% Buy Box`,
                detail: `${scaledView.glanceViews.toLocaleString()} views · ${scaledView.conversionPct.toFixed(2)}% conv`,
              },
            ].map((kpi, idx) => (
              <div
                key={kpi.label}
                className={`p-5 border-zinc-200 dark:border-zinc-800 ${
                  idx % 4 !== 3 ? 'md:border-r' : ''
                } ${idx < 4 ? 'border-b' : 'border-b md:border-b-0'}`}
              >
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {kpi.label}
                </div>
                <div
                  className={`mt-1.5 text-xl font-bold font-mono tabular-nums ${
                    kpi.highlight ? 'text-[#FF6A00]' : 'text-black dark:text-white'
                  }`}
                >
                  {kpi.value}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{kpi.detail}</div>
              </div>
            ))}
          </div>

          {/* Charts Row: 1P Sales vs Ad Sales + ACOS vs TACoS Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: 1P Shipped Sales vs Ad-Attributed Sales */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Total 1P Shipped Sales vs. Ad-Attributed Sales
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Organic + Paid Vendor Central UK revenue progression ({TIMEFRAME_FACTORS[timeframe].label})
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-zinc-900 dark:bg-white inline-block" />
                    <span>Total 1P Sales</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#FF6A00] inline-block" />
                    <span>Ad-Attributed</span>
                  </span>
                </div>
              </div>

              <div className="grid gap-3 items-end pt-2" style={{ gridTemplateColumns: `repeat(${scaledView.chartPoints.length}, minmax(0, 1fr))`, height: '185px' }}>
                {scaledView.chartPoints.map((pt) => {
                  const totalH = Math.max(Math.round((pt.totalSalesGbp / maxChartSales) * 145), 8);
                  const adH = Math.max(Math.round((pt.adSalesGbp / maxChartSales) * 145), 6);
                  return (
                    <div key={pt.label} className="flex flex-col items-center justify-end h-full gap-1.5">
                      <div className="flex items-end gap-1.5 justify-center w-full">
                        <div
                          className="w-4 sm:w-6 bg-zinc-900 dark:bg-zinc-200"
                          style={{ height: `${totalH}px` }}
                          title={`${pt.label} Total 1P Sales: £${pt.totalSalesGbp.toLocaleString()}`}
                        />
                        <div
                          className="w-4 sm:w-6 bg-[#FF6A00]"
                          style={{ height: `${adH}px` }}
                          title={`${pt.label} Ad Sales: £${pt.adSalesGbp.toLocaleString()}`}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-full">
                        {pt.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                className="grid gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center"
                style={{ gridTemplateColumns: `repeat(${scaledView.chartPoints.length}, minmax(0, 1fr))` }}
              >
                {scaledView.chartPoints.map((pt) => (
                  <div key={`val-${pt.label}`} className="text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                    £{(pt.totalSalesGbp / 1000).toFixed(1)}k
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: ACOS % & TACoS % Efficiency Breakdown */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Advertising Efficiency: ACOS % vs. TACoS %
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Period-by-period ad spend efficiency against Amazon UK BWS benchmarks
                  </p>
                </div>
                <span className="text-[11px] font-mono text-[#FF6A00]">
                  ROAS: {scaledView.roas.toFixed(2)}×
                </span>
              </div>

              <div className="space-y-3.5 pt-1">
                {scaledView.chartPoints.map((pt) => {
                  const ptAcos = pt.adSalesGbp > 0 ? (pt.adSpendGbp / pt.adSalesGbp) * 100 : 0;
                  const ptTacos = pt.totalSalesGbp > 0 ? (pt.adSpendGbp / pt.totalSalesGbp) * 100 : 0;
                  return (
                    <div key={`eff-${pt.label}`} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-black dark:text-white font-mono">
                          {pt.label} · Spend £{pt.adSpendGbp.toLocaleString()}
                        </span>
                        <span className="font-mono tabular-nums text-[11px] text-zinc-600 dark:text-zinc-400">
                          ACOS <strong className="text-[#FF6A00]">{ptAcos.toFixed(1)}%</strong> · TACoS{' '}
                          <strong className="text-black dark:text-white">{ptTacos.toFixed(1)}%</strong>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900">
                          <div
                            className="h-full bg-[#FF6A00]"
                            style={{ width: `${Math.min(ptAcos * 3, 100)}%` }}
                          />
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900">
                          <div
                            className="h-full bg-zinc-900 dark:bg-zinc-300"
                            style={{ width: `${Math.min(ptTacos * 3, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ASIN Performance Breakdown Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Amazon.co.uk 1P ASIN Performance Breakdown ({brandProfile.name})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Shipped COGS/revenue, ordered units, glance views, unit conversion %, ACOS & 1P Buy Box control
                </p>
              </div>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                {scaledView.asins.length} tracked ASINs
              </span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                  <th className="py-3 px-4">ASIN & Product</th>
                  <th className="py-3 px-4 text-right">1P Shipped Rev</th>
                  <th className="py-3 px-4 text-right">Units</th>
                  <th className="py-3 px-4 text-right">Glance Views</th>
                  <th className="py-3 px-4 text-right">Conv %</th>
                  <th className="py-3 px-4 text-right">Ad Spend</th>
                  <th className="py-3 px-4 text-right">Ad Sales</th>
                  <th className="py-3 px-4 text-right">ACOS</th>
                  <th className="py-3 px-4 text-right">1P Buy Box</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {scaledView.asins.map((row) => {
                  const rowAcos = row.adSalesGbp > 0 ? (row.adSpendGbp / row.adSalesGbp) * 100 : 0;
                  return (
                    <tr key={row.asin} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                      <td className="py-3.5 px-4 min-w-[240px]">
                        <div className="font-mono text-[11px] text-[#FF6A00] font-semibold">
                          {row.asin}
                        </div>
                        <div className="font-semibold text-black dark:text-white mt-0.5">
                          {row.skuName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-black dark:text-white">
                        £{row.shippedRevenueGbp.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {row.orderedUnits.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                        {row.glanceViews.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {row.conversionPct.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        £{row.adSpendGbp.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        £{row.adSalesGbp.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#FF6A00]">
                        {rowAcos.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {row.buyBoxPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Active Amazon Advertising Campaigns Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Active Amazon Advertising Campaigns ({brandProfile.name})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  18+ age-gated Sponsored Products, Sponsored Brands, Sponsored Display & Streaming CTV/Audio
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#FF6A00]">
                CAP Section 18 Verified
              </span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Format & Surface</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Impressions</th>
                  <th className="py-3 px-4 text-right">Clicks (CTR)</th>
                  <th className="py-3 px-4 text-right">Ad Spend</th>
                  <th className="py-3 px-4 text-right">Ad Sales</th>
                  <th className="py-3 px-4 text-right">ACOS / ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {scaledView.campaigns.map((cmp) => {
                  const ctr = cmp.impressions > 0 ? (cmp.clicks / cmp.impressions) * 100 : 0;
                  const acos = cmp.salesGbp > 0 ? (cmp.spendGbp / cmp.salesGbp) * 100 : 0;
                  const roas = cmp.spendGbp > 0 ? cmp.salesGbp / cmp.spendGbp : 0;
                  return (
                    <tr key={cmp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                      <td className="py-3.5 px-4 font-semibold text-black dark:text-white min-w-[230px]">
                        {cmp.campaignName}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        <div>{cmp.formatLabel}</div>
                        <div className="text-[11px] text-zinc-500">{cmp.channelLabel}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
                        {cmp.status}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {cmp.impressions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {cmp.clicks.toLocaleString()} ({ctr.toFixed(2)}%)
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        £{cmp.spendGbp.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-black dark:text-white">
                        £{cmp.salesGbp.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <span className="font-bold text-[#FF6A00]">{acos.toFixed(1)}%</span> ·{' '}
                        <span className="text-black dark:text-white">{roas.toFixed(2)}×</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 2: POs & DIRECT-SHIP ROUTING
       * =================================================================== */}
      {activeTab === 'pos' && (
        <div className="space-y-6">
          <PrototypeBannerNote text="Amazon Vendor Central UK (1P) PO routing: select Direct-Ship via Mercenta DHL Credit Account (#MER-DHL-UK-8841), WePrep Duty-Paid Prep (Ipswich), or 3P Wet-Bond release with live 3–14 day SLA cutoff checking." />

          <MetricStrip
            items={[
              {
                label: 'Active Vendor Central UK POs',
                value: String(brandPos.length),
                detail: '1P wholesale purchase orders (Zero FBA)',
                highlight: true,
              },
              {
                label: 'Mercenta DHL Credit Account',
                value: 'MER-DHL-UK-8841',
                detail: 'Prepaid partner direct-ship waybills',
              },
              {
                label: 'Live Partner SKUs',
                value: String(brandSkus.length),
                detail: 'Synced to Catalogue & Campaign Studio',
              },
              {
                label: 'Default Fulfilment Route',
                value:
                  account.defaultPathway === 'direct_ship_dhl'
                    ? 'Direct-Ship DHL'
                    : account.defaultPathway === 'weprep_duty_paid'
                    ? 'WePrep 1P Prep'
                    : '3P Wet-Bond → WePrep',
                detail: `Lead time baseline: ${account.defaultLeadTimeDays} days`,
                highlight: true,
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-black dark:text-white">
                <UserCheck className="w-4 h-4 text-[#FF6A00]" />
                <span>Mercenta Account Stewardship</span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                <div>
                  Partner Login: <span className="font-mono text-black dark:text-white">{account.portalEmail}</span>
                </div>
                <div>
                  Account Manager: <span className="font-semibold text-black dark:text-white">{account.mercentaAccountManager}</span>
                </div>
                <div className="font-mono text-[11px] text-[#FF6A00]">{account.accountManagerEmail}</div>
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-black dark:text-white">
                <Truck className="w-4 h-4 text-[#FF6A00]" />
                <span>Mercenta DHL Business Credit & Customs</span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                <div>
                  DHL Account: <span className="font-mono text-black dark:text-white">{account.dhlAccountNumber}</span>
                </div>
                <div>
                  Importer GB EORI: <span className="font-mono text-black dark:text-white">{account.mercentaEori}</span>
                </div>
                <div>
                  HMRC AWRS URN: <span className="font-mono text-black dark:text-white">{account.mercentaAwrsUrn}</span>
                </div>
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-black dark:text-white">
                <Warehouse className="w-4 h-4 text-[#FF6A00]" />
                <span>WePrep & 3P Wet-Bond Operating Rule</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <strong className="text-black dark:text-white">WePrep UK (Ipswich)</strong> is strictly non-bonded and handles{' '}
                <strong className="text-black dark:text-white">duty-paid 1P Vendor Central prep</strong> only. Bulk duty-suspended stock holds at{' '}
                <strong className="text-[#FF6A00]">{account.wetBondPartnerName}</strong> prior to duty-paid call-off.
              </p>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-black dark:text-white">
                  Active Amazon Vendor Central UK (1P) Purchase Orders
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Select your fulfilment pathway and dispatch lead time (3–14 days) to calculate exact DHL pickup & 1P FC delivery cutoffs.
                </p>
              </div>
              <span className="text-xs font-mono text-[#FF6A00]">Strictly 1P Wholesale · Zero FBA</span>
            </div>

            {brandPos.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <p className="font-semibold text-black dark:text-white">
                  No active Amazon Vendor Central UK POs currently queued for {brandProfile.name}.
                </p>
                <p>
                  Once onboarded into Vendor Central 1P, incoming Amazon FC purchase orders appear here with live DHL Credit (#MER-DHL-UK-8841) and WePrep / Wet-Bond routing.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {brandPos.map((po) => {
                  const transitBufferDays = po.selectedPathway === 'direct_ship_dhl' ? 3 : 2;
                  const dhlLatestDispatchDate = addDaysIso(po.amazonWindowEnd, -transitBufferDays);
                  const brandDispatchPlanDate = addDaysIso(po.poReceivedDate, po.dispatchLeadTimeDays);
                  const onTimeReady = brandDispatchPlanDate <= dhlLatestDispatchDate;

                  return (
                    <div key={po.id} className="p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-[#FF6A00]">{po.poNumber}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-black dark:text-white">FC: {po.amazonFcCode}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-zinc-600 dark:text-zinc-300">
                              {po.casesRequested} cases (£{po.totalCostGbp.toLocaleString()})
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-black dark:text-white">{po.skuName}</h3>
                          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                            PO Received: {po.poReceivedDate} · Amazon 1P Window End: {po.amazonWindowEnd}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-black dark:text-white px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                            {po.status}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdatePo({
                                ...po,
                                status:
                                  po.selectedPathway === 'direct_ship_dhl'
                                    ? 'DHL Waybill Scheduled'
                                    : 'WePrep 1P ASN Queued',
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#FF6A00] hover:bg-[#E55F00] text-white cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Route & Dispatch</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {PATHWAY_OPTIONS.map((opt) => {
                          const active = po.selectedPathway === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => onUpdatePo({ ...po, selectedPathway: opt.id })}
                              className={`p-3.5 border text-left transition-colors cursor-pointer ${
                                active
                                  ? 'border-[#FF6A00] bg-zinc-950 text-white dark:bg-white dark:text-black'
                                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                              }`}
                            >
                              <div className="text-xs font-bold">{opt.title}</div>
                              <div
                                className={`text-[11px] font-mono mt-0.5 ${
                                  active ? 'text-[#FF6A00]' : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                {opt.subtitle}
                              </div>
                              <p
                                className={`text-[11px] mt-1.5 leading-relaxed ${
                                  active ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                {opt.detail}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
                        <div className="lg:col-span-5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-black dark:text-white flex items-center gap-1.5">
                              <CalendarClock className="w-3.5 h-3.5 text-[#FF6A00]" />
                              <span>Brand Dispatch Lead Time (3–14 Days)</span>
                            </label>
                            <span className="font-mono font-bold text-[#FF6A00]">
                              {po.dispatchLeadTimeDays} days
                            </span>
                          </div>
                          <input
                            type="range"
                            min={3}
                            max={14}
                            value={po.dispatchLeadTimeDays}
                            onChange={(e) =>
                              onUpdatePo({ ...po, dispatchLeadTimeDays: Number(e.target.value) })
                            }
                            aria-label="Dispatch lead time in days"
                            className="w-full accent-[#FF6A00]"
                          />
                          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                            <span>3d Fast Dispatch</span>
                            <span>7d Standard</span>
                            <span>14d Max Window</span>
                          </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 pt-3 lg:pt-0 lg:pl-4">
                          <div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Planned Dispatch Date</div>
                            <div className="font-mono font-semibold text-black dark:text-white mt-0.5">
                              {brandDispatchPlanDate}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {po.selectedPathway === 'direct_ship_dhl'
                                ? 'DHL Credit Cutoff SLA'
                                : 'WePrep Intake Cutoff'}
                            </div>
                            <div className="font-mono font-semibold text-black dark:text-white mt-0.5">
                              {dhlLatestDispatchDate}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">1P Window Health</div>
                            <div
                              className={`font-semibold mt-0.5 ${
                                onTimeReady
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-[#FF6A00]'
                              }`}
                            >
                              {onTimeReady
                                ? 'Meets Amazon 1P Window'
                                : 'Exceeds Window — Lower Lead Time or Call Off Bond'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Approved 3P UK Wet-Bond Warehouses (When Holding Duty-Suspended Stock Before WePrep)
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                HMRC WOWGR Owner Registration Repealed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WET_BOND_PARTNERS.map((wb) => (
                <div
                  key={wb.id}
                  className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-black dark:text-white">{wb.name}</span>
                    <Building2 className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{wb.location}</div>
                  <div className="text-[11px] text-zinc-700 dark:text-zinc-300">{wb.bestFor}</div>
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-zinc-500">Setup: {wb.estimatedTimeline}</span>
                    <a
                      href={wb.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#FF6A00] hover:underline"
                    >
                      Official Site →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 3: SKU SPECS & BOTTLE MEDIA UPLOADS
       * =================================================================== */}
      {activeTab === 'skus' && (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-black dark:text-white">
                Partner SKU Specs & Bottle Media Uploads ({brandProfile.name})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Edit ABV%, tasting notes, RRP, or upload fresh bottle/packshot images. Changes sync live to Product Catalogue & Campaign Studio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white transition-colors cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel New SKU' : 'Add Partner SKU'}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreateSku}
              className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4 text-xs"
            >
              <div className="font-semibold text-black dark:text-white">
                Register New {brandProfile.name} SKU for Amazon Vendor Central UK (1P)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-zinc-500 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={newSkuName}
                    onChange={(e) => setNewSkuName(e.target.value)}
                    placeholder={`e.g. ${brandProfile.name} 18 Year Reserve`}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Category</label>
                  <select
                    value={newSkuCategory}
                    onChange={(e) => setNewSkuCategory(e.target.value as DrinkCategory)}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  >
                    {ALL_DRINK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Style / Type</label>
                  <input
                    type="text"
                    value={newSkuType}
                    onChange={(e) => setNewSkuType(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Bottle Size</label>
                  <input
                    type="text"
                    value={newSkuSize}
                    onChange={(e) => setNewSkuSize(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">ABV %</label>
                  <input
                    type="text"
                    value={newSkuAbv}
                    onChange={(e) => setNewSkuAbv(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">1P Cost / Wholesale (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSkuWholesale}
                    onChange={(e) => setNewSkuWholesale(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Target UK RRP (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSkuRrp}
                    onChange={(e) => setNewSkuRrp(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-zinc-500 mb-1">Pack Format</label>
                  <input
                    type="text"
                    value={newSkuPack}
                    onChange={(e) => setNewSkuPack(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-zinc-500 mb-1">Upload Bottle Packshot (PNG/JPG)</label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-zinc-400 dark:border-zinc-700 bg-white dark:bg-black cursor-pointer hover:border-[#FF6A00]">
                    <Upload className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>{newSkuImage ? 'Image Loaded — Replace File' : 'Choose Bottle Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageFileUpload(e.target.files?.[0], (url) => setNewSkuImage(url))
                      }
                    />
                  </label>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[11px] text-zinc-500 mb-1">Tasting Notes & Provenance Highlights</label>
                  <input
                    type="text"
                    value={newSkuNotes}
                    onChange={(e) => setNewSkuNotes(e.target.value)}
                    placeholder="Used by Campaign Studio AI to craft compliant UK ad copy..."
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold cursor-pointer"
                >
                  Save SKU to Live Catalogue
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {brandSkus.map((sku, skuIdx) => {
              const isEditing = editingSkuId === sku.id && editDraft;
              const liveSku = isEditing ? editDraft : sku;
              const isPriceChartOpen =
                expandedPriceSkuIds[sku.id] !== undefined
                  ? expandedPriceSkuIds[sku.id]
                  : skuIdx === 0 || Boolean(isEditing);
              const matchedListing = AMAZON_UK_LISTINGS.find(
                (a) => a.brandId === brandProfile.id
              );

              return (
                <div key={sku.id} className="p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-5 items-start">
                    <div className="w-full lg:w-36 shrink-0 space-y-2">
                      <ProductVisual
                        src={isEditing ? editDraft.imageUrl : sku.imageUrl}
                        alt={sku.name}
                        className="w-full lg:w-36 h-36 object-contain bg-white dark:bg-zinc-950 p-1.5 border border-zinc-200 dark:border-zinc-800"
                      />
                      <label className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border border-zinc-300 dark:border-zinc-700 hover:border-[#FF6A00] text-black dark:text-white cursor-pointer">
                        <Upload className="w-3 h-3 text-[#FF6A00]" />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageFileUpload(e.target.files?.[0], (url) => {
                              if (isEditing && editDraft) {
                                setEditDraft({ ...editDraft, imageUrl: url });
                              } else {
                                onUpdateSku({ ...sku, imageUrl: url });
                              }
                            })
                          }
                        />
                      </label>
                    </div>

                    {isEditing ? (
                      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] text-zinc-500 mb-1">SKU Title</label>
                          <input
                            type="text"
                            value={editDraft.name}
                            onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-500 mb-1">ABV %</label>
                          <input
                            type="text"
                            value={editDraft.abv}
                            onChange={(e) => setEditDraft({ ...editDraft, abv: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-500 mb-1">Bottle Size</label>
                          <input
                            type="text"
                            value={editDraft.bottleSize}
                            onChange={(e) => setEditDraft({ ...editDraft, bottleSize: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-500 mb-1">1P Cost (£)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editDraft.illustrativeWholesaleGbp}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                illustrativeWholesaleGbp: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-500 mb-1">Target RRP (£)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editDraft.illustrativeRrpGbp}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                illustrativeRrpGbp: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[11px] text-zinc-500 mb-1">Tasting Notes & Serve Details</label>
                          <input
                            type="text"
                            value={editDraft.tastingNotes || ''}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, tastingNotes: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSkuId(null);
                              setEditDraft(null);
                            }}
                            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-4 py-1.5 bg-[#FF6A00] text-white text-xs font-semibold cursor-pointer"
                          >
                            Save & Sync Across Platform
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0 space-y-2 text-xs">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-black dark:text-white">{sku.name}</h3>
                            <div className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {sku.category} · {sku.productType} · {sku.bottleSize} ·{' '}
                              <span className="font-mono font-semibold text-black dark:text-white">
                                {sku.abv} ABV
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPriceSkuIds((prev) => ({
                                  ...prev,
                                  [sku.id]: !isPriceChartOpen,
                                }))
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-xs font-medium hover:border-[#FF6A00] cursor-pointer"
                            >
                              <LineChart className="w-3.5 h-3.5 text-[#FF6A00]" />
                              <span>12M UK Price Trend</span>
                              {isPriceChartOpen ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(sku)}
                              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-xs font-medium hover:border-[#FF6A00] cursor-pointer"
                            >
                              Edit SKU Details
                            </button>
                          </div>
                        </div>

                        <p className="text-zinc-700 dark:text-zinc-300">
                          <strong className="text-black dark:text-white">Tasting Notes:</strong>{' '}
                          {sku.tastingNotes || sku.packagingInfo}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span>Pack: {sku.packFormat}</span>
                          <span>1P Cost Est: £{sku.illustrativeWholesaleGbp.toFixed(2)}</span>
                          <span className="text-[#FF6A00] font-semibold">
                            Target UK RRP: £{sku.illustrativeRrpGbp.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isPriceChartOpen && (
                    <SkuPriceHistoryChart
                      sku={liveSku}
                      brand={brandProfile}
                      amazonListing={matchedListing}
                      compact
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
