import React, { useMemo, useState } from 'react';
import {
  AmazonUkListingRecord,
  BrandProfile,
  ProductSku,
  RadarBenchmarkMetrics,
  RadarComparisonMode,
} from '../../types/bws';
import {
  buildSkuPriceHistory12m,
  selectRadarComparisonPeers,
} from '../../utils/bwsAnalytics';

/* ============================================================================
 * 1. COMPETITOR BENCHMARKING RADAR CHART (3-AXIS & 5-AXIS + 3 PEER MODES)
 * ========================================================================== */
type RadarAxisKey =
  | 'pricePoint'
  | 'distributionCoverage'
  | 'marketingReach'
  | 'amazon1pControl'
  | 'brandMargin';

const CORE_3_AXES: { key: RadarAxisKey; label: string; shortLabel: string; helper: string }[] = [
  {
    key: 'pricePoint',
    label: 'Price Point',
    shortLabel: 'Price Point',
    helper: 'UK RRP competitiveness vs category median & pricing parity',
  },
  {
    key: 'distributionCoverage',
    label: 'Distribution Coverage',
    shortLabel: 'Distribution',
    helper: 'UK importer maturity & international market footprint',
  },
  {
    key: 'marketingReach',
    label: 'Marketing Reach',
    shortLabel: 'Marketing Reach',
    helper: 'Amazon UK A+ Content, Brand Store & range coverage %',
  },
];

const EXTRA_2_AXES: { key: RadarAxisKey; label: string; shortLabel: string; helper: string }[] = [
  {
    key: 'amazon1pControl',
    label: 'Amazon 1P Control',
    shortLabel: '1P Control',
    helper: '"Sold by Amazon" Buy Box governance vs 3P leakage',
  },
  {
    key: 'brandMargin',
    label: 'Brand Margin',
    shortLabel: '1P Margin',
    helper: 'Wholesale-to-RRP 1P commercial margin headroom',
  },
];

interface PeerStrokeStyle {
  stroke: string;
  fill: string;
  fillOpacity: number;
  dashArray?: string;
  swatchClass: string;
}

const PEER_STYLES: PeerStrokeStyle[] = [
  {
    stroke: '#3F3F46',
    fill: '#3F3F46',
    fillOpacity: 0.08,
    dashArray: '5 4',
    swatchClass: 'bg-zinc-700 dark:bg-zinc-300',
  },
  {
    stroke: '#0D9488',
    fill: '#0D9488',
    fillOpacity: 0.07,
    dashArray: '2 3',
    swatchClass: 'bg-teal-600 dark:bg-teal-400',
  },
  {
    stroke: '#71717A',
    fill: '#71717A',
    fillOpacity: 0.04,
    dashArray: '8 3 2 3',
    swatchClass: 'bg-zinc-400',
  },
];

export const CompetitorRadarChart: React.FC<{
  selectedBrand: BrandProfile;
  brands: BrandProfile[];
  skus: ProductSku[];
  amazonListings: AmazonUkListingRecord[];
}> = ({ selectedBrand, brands, skus, amazonListings }) => {
  const [peerMode, setPeerMode] = useState<RadarComparisonMode>('leaders-avg');
  const [axisMode, setAxisMode] = useState<'3-axis' | '5-axis'>('5-axis');
  const [customPeerId, setCustomPeerId] = useState<string>('');
  const [hoveredAxisIdx, setHoveredAxisIdx] = useState<number | null>(null);

  const axes = useMemo(
    () => (axisMode === '3-axis' ? CORE_3_AXES : [...CORE_3_AXES, ...EXTRA_2_AXES]),
    [axisMode]
  );

  const comparison = useMemo(
    () =>
      selectRadarComparisonPeers(
        selectedBrand,
        brands,
        skus,
        amazonListings,
        peerMode,
        customPeerId
      ),
    [selectedBrand, brands, skus, amazonListings, peerMode, customPeerId]
  );

  const effectiveCustomPeerId =
    peerMode === 'custom' && comparison.peers[0]
      ? comparison.peers[0].id
      : customPeerId || comparison.availableCustomPeers[0]?.id || '';

  // SVG geometry
  const size = 340;
  const cx = size / 2;
  const cy = size / 2 + 4;
  const radius = 104;
  const rings = [20, 40, 60, 80, 100];

  const getPoint = (axisIndex: number, value: number) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / axes.length;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      angle,
    };
  };

  const buildPolygonPoints = (metrics: RadarBenchmarkMetrics) =>
    axes
      .map((ax, i) => {
        const pt = getPoint(i, metrics[ax.key]);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

  const hoveredAxis = hoveredAxisIdx !== null ? axes[hoveredAxisIdx] : null;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="text-[11px] font-mono text-[#FF6A00]">
            Competitor Benchmarking · {selectedBrand.primaryCategory}
          </div>
          <h2 className="text-sm font-semibold text-black dark:text-white mt-0.5">
            {selectedBrand.name} vs. UK Market Benchmarks
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Normalized 0–100 positioning across pricing discipline, distribution footprint, marketing reach &amp; 1P governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Axis Count Toggle */}
          <div
            role="group"
            aria-label="Radar axis dimensions"
            className="flex border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5"
          >
            <button
              type="button"
              onClick={() => {
                setAxisMode('3-axis');
                setHoveredAxisIdx(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                axisMode === '3-axis'
                  ? 'bg-white dark:bg-black text-black dark:text-white'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              3 Core Axes
            </button>
            <button
              type="button"
              onClick={() => {
                setAxisMode('5-axis');
                setHoveredAxisIdx(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                axisMode === '5-axis'
                  ? 'bg-white dark:bg-black text-black dark:text-white'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              5 Full Axes
            </button>
          </div>
        </div>
      </div>

      {/* Peer Comparison Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Competitor peer selection mode"
          className="flex flex-wrap border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5"
        >
          <button
            type="button"
            onClick={() => setPeerMode('leaders-avg')}
            className={`px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              peerMode === 'leaders-avg'
                ? 'bg-white dark:bg-black text-black dark:text-white'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            1P Leaders + Category Avg
          </button>
          <button
            type="button"
            onClick={() => setPeerMode('top2-leaders')}
            className={`px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              peerMode === 'top2-leaders'
                ? 'bg-white dark:bg-black text-black dark:text-white'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Top 2 UK 1P Leaders
          </button>
          <button
            type="button"
            onClick={() => setPeerMode('custom')}
            className={`px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              peerMode === 'custom'
                ? 'bg-white dark:bg-black text-black dark:text-white'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Custom Brand Comparison
          </button>
        </div>

        {peerMode === 'custom' && (
          <select
            value={effectiveCustomPeerId}
            onChange={(e) => setCustomPeerId(e.target.value)}
            aria-label="Choose custom competitor brand"
            className="px-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:border-[#FF6A00]"
          >
            {comparison.availableCustomPeers.map((b) => (
              <option key={b.id} value={b.id}>
                Compare vs. {b.name} ({b.primaryCategory})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Interactive SVG Radar */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[360px]">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-auto select-none overflow-visible"
              role="img"
              aria-label={`Competitor benchmarking radar chart for ${selectedBrand.name}`}
            >
              {/* Concentric Polygon Grid Rings */}
              {rings.map((ring) => {
                const ringPts = axes
                  .map((_, i) => {
                    const pt = getPoint(i, ring);
                    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={ring}
                    points={ringPts}
                    fill="none"
                    stroke="currentColor"
                    className="text-zinc-200 dark:text-zinc-800"
                    strokeWidth={ring === 100 ? 1.2 : 0.8}
                  />
                );
              })}

              {/* Ring scale labels along vertical top axis */}
              {rings.map((ring) => {
                const pt = getPoint(0, ring);
                return (
                  <text
                    key={`lbl-${ring}`}
                    x={pt.x + 4}
                    y={pt.y + 3}
                    className="fill-zinc-400 dark:fill-zinc-500 text-[8px] font-mono"
                  >
                    {ring}
                  </text>
                );
              })}

              {/* Radial Axis Spokes + Outer Labels */}
              {axes.map((ax, i) => {
                const end = getPoint(i, 100);
                const labelPt = getPoint(i, 122);
                const cos = Math.cos(end.angle);
                const textAnchor =
                  Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';
                const isHovered = hoveredAxisIdx === i;

                return (
                  <g key={ax.key}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={end.x}
                      y2={end.y}
                      stroke="currentColor"
                      className={
                        isHovered
                          ? 'text-[#FF6A00]'
                          : 'text-zinc-200 dark:text-zinc-800'
                      }
                      strokeWidth={isHovered ? 1.4 : 0.9}
                    />
                    <text
                      x={labelPt.x}
                      y={labelPt.y}
                      textAnchor={textAnchor}
                      dominantBaseline="middle"
                      onMouseEnter={() => setHoveredAxisIdx(i)}
                      onMouseLeave={() => setHoveredAxisIdx(null)}
                      className={`text-[10.5px] font-semibold cursor-pointer transition-colors ${
                        isHovered
                          ? 'fill-[#FF6A00]'
                          : 'fill-zinc-700 dark:fill-zinc-300'
                      }`}
                    >
                      {ax.shortLabel}
                    </text>
                  </g>
                );
              })}

              {/* Peer Polygons (drawn behind selected brand) */}
              {comparison.peers.map((peer, peerIdx) => {
                const st = PEER_STYLES[peerIdx % PEER_STYLES.length];
                return (
                  <g key={peer.id}>
                    <polygon
                      points={buildPolygonPoints(peer.metrics)}
                      fill={st.fill}
                      fillOpacity={st.fillOpacity}
                      stroke={st.stroke}
                      strokeWidth={1.6}
                      strokeDasharray={st.dashArray}
                      className="transition-all duration-150"
                    />
                    {axes.map((ax, axisIdx) => {
                      const pt = getPoint(axisIdx, peer.metrics[ax.key]);
                      return (
                        <circle
                          key={`${peer.id}-${ax.key}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredAxisIdx === axisIdx ? 3.8 : 2.5}
                          fill={st.stroke}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredAxisIdx(axisIdx)}
                          onMouseLeave={() => setHoveredAxisIdx(null)}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Selected Brand Polygon (foreground #FF6A00) */}
              <polygon
                points={buildPolygonPoints(comparison.selected)}
                fill="#FF6A00"
                fillOpacity={0.18}
                stroke="#FF6A00"
                strokeWidth={2.2}
                className="transition-all duration-150"
              />
              {axes.map((ax, axisIdx) => {
                const pt = getPoint(axisIdx, comparison.selected[ax.key]);
                return (
                  <circle
                    key={`sel-${ax.key}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredAxisIdx === axisIdx ? 5 : 3.5}
                    fill="#FF6A00"
                    stroke="#FFFFFF"
                    strokeWidth={1.2}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredAxisIdx(axisIdx)}
                    onMouseLeave={() => setHoveredAxisIdx(null)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Interactive Axis Detail Strip */}
          <div className="w-full mt-2 p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs min-h-[58px]">
            {hoveredAxis ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-black dark:text-white">
                    {hoveredAxis.label}
                  </span>
                  <span className="font-mono tabular-nums text-[#FF6A00] font-semibold">
                    {selectedBrand.name}: {comparison.selected[hoveredAxis.key]}/100
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {hoveredAxis.helper}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Hover any axis label or polygon vertex to inspect exact dimension scores and methodology.
              </div>
            )}
          </div>
        </div>

        {/* Numeric Comparison Ledger + Series Legend */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-1.5 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <span className="inline-flex items-center gap-2 font-semibold text-black dark:text-white">
                <span className="w-3 h-0.5 bg-[#FF6A00] inline-block" />
                <span>{selectedBrand.name}</span>
              </span>
              <span className="font-mono text-[11px] text-[#FF6A00]">Selected Brand</span>
            </div>

            {comparison.peers.map((peer, idx) => {
              const st = PEER_STYLES[idx % PEER_STYLES.length];
              return (
                <div
                  key={peer.id}
                  className="flex items-center justify-between py-1.5 px-2.5 border border-zinc-200 dark:border-zinc-800"
                >
                  <span className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium truncate pr-2">
                    <span className={`w-3 h-0.5 inline-block shrink-0 ${st.swatchClass}`} />
                    <span className="truncate">{peer.label}</span>
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
                    {peer.roleLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Numeric Comparison Matrix */}
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <th className="py-2 px-3 font-medium">Dimension</th>
                  <th className="py-2 px-3 font-medium text-right text-[#FF6A00]">Brand</th>
                  {comparison.peers.map((peer) => (
                    <th key={`th-${peer.id}`} className="py-2 px-3 font-medium text-right truncate max-w-[95px]">
                      {peer.label.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {axes.map((ax, i) => {
                  const brandVal = comparison.selected[ax.key];
                  const firstPeerVal = comparison.peers[0]?.metrics[ax.key];
                  const delta = firstPeerVal !== undefined ? brandVal - firstPeerVal : 0;
                  return (
                    <tr
                      key={`row-${ax.key}`}
                      onMouseEnter={() => setHoveredAxisIdx(i)}
                      onMouseLeave={() => setHoveredAxisIdx(null)}
                      className={`transition-colors ${
                        hoveredAxisIdx === i ? 'bg-zinc-50 dark:bg-zinc-900/60' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-medium text-black dark:text-white">
                        {ax.label}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-[#FF6A00]">
                        {brandVal}
                      </td>
                      {comparison.peers.map((peer, pIdx) => {
                        const val = peer.metrics[ax.key];
                        return (
                          <td
                            key={`cell-${ax.key}-${peer.id}`}
                            className="py-2 px-3 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300"
                          >
                            {val}
                            {pIdx === 0 && (
                              <span
                                className={`ml-1 text-[10px] ${
                                  delta >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                ({delta >= 0 ? `+${delta}` : delta})
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. PRODUCT SKU 12-MONTH UK PRICE HISTORY CHART
 * ========================================================================== */
export const SkuPriceHistoryChart: React.FC<{
  sku: ProductSku;
  brand?: BrandProfile;
  amazonListing?: AmazonUkListingRecord;
  compact?: boolean;
}> = ({ sku, brand, amazonListing, compact = false }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showObserved, setShowObserved] = useState(true);
  const [showRrp, setShowRrp] = useState(true);
  const [showWholesale, setShowWholesale] = useState(true);

  const series = useMemo(
    () => buildSkuPriceHistory12m(sku, brand, amazonListing),
    [sku, brand, amazonListing]
  );

  const latest = series[series.length - 1];
  const oldest = series[0];
  const driftGbp = Math.round((latest.observedUkPriceGbp - latest.targetRrpGbp) * 100) / 100;
  const driftPct =
    latest.targetRrpGbp > 0
      ? Math.round((driftGbp / latest.targetRrpGbp) * 100)
      : 0;
  const marginGbp = Math.round((latest.targetRrpGbp - latest.wholesaleCostGbp) * 100) / 100;
  const marginPct =
    latest.targetRrpGbp > 0
      ? Math.round((marginGbp / latest.targetRrpGbp) * 100)
      : 0;
  const yoyChangePct =
    oldest.observedUkPriceGbp > 0
      ? Math.round(
          ((latest.observedUkPriceGbp - oldest.observedUkPriceGbp) /
            oldest.observedUkPriceGbp) *
            1000
        ) / 10
      : 0;

  // Compute Y bounds across active visible series
  const allVals = series.flatMap((pt) => [
    showObserved ? pt.observedUkPriceGbp : pt.targetRrpGbp,
    showRrp ? pt.targetRrpGbp : pt.observedUkPriceGbp,
    showWholesale ? pt.wholesaleCostGbp : pt.targetRrpGbp,
  ]);
  const rawMin = Math.min(...allVals, sku.illustrativeWholesaleGbp || 5);
  const rawMax = Math.max(...allVals, sku.illustrativeRrpGbp || 10);
  const pad = Math.max(1.5, (rawMax - rawMin) * 0.2);
  const minY = Math.max(0, Math.floor((rawMin - pad) * 2) / 2);
  const maxY = Math.ceil((rawMax + pad) * 2) / 2;

  const width = 620;
  const height = compact ? 190 : 225;
  const padLeft = 46;
  const padRight = 18;
  const padTop = 16;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, series.length - 1)) * plotW;
  const getY = (val: number) =>
    padTop + ((maxY - val) / Math.max(0.01, maxY - minY)) * plotH;

  const toPath = (getter: (pt: (typeof series)[number]) => number) =>
    series
      .map(
        (pt, i) =>
          `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(getter(pt)).toFixed(1)}`
      )
      .join(' ');

  // Shaded 1P margin headroom polygon between Target RRP and 1P Wholesale Cost
  const marginAreaPoints = [
    ...series.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.targetRrpGbp).toFixed(1)}`),
    ...[...series]
      .reverse()
      .map(
        (pt, revIdx) =>
          `${getX(series.length - 1 - revIdx).toFixed(1)},${getY(pt.wholesaleCostGbp).toFixed(1)}`
      ),
  ].join(' ');

  const yTicks = [0, 0.33, 0.66, 1].map((t) => minY + (maxY - minY) * t);
  const activePoint = hoveredIdx !== null ? series[hoveredIdx] : latest;
  const activeDrift =
    Math.round((activePoint.observedUkPriceGbp - activePoint.targetRrpGbp) * 100) / 100;
  const activeMargin =
    Math.round((activePoint.targetRrpGbp - activePoint.wholesaleCostGbp) * 100) / 100;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono text-[#FF6A00]">
            12-Month UK Price History · Dec 2025 – Nov 2026
          </div>
          <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white mt-0.5">
            {sku.name} — Observed Amazon UK vs. Target RRP &amp; 1P Cost
          </h4>
        </div>

        {/* Interactive Series Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setShowObserved((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2 py-1 border cursor-pointer transition-colors ${
              showObserved
                ? 'border-[#FF6A00] bg-[#FF6A00]/10 text-black dark:text-white font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-[#FF6A00] inline-block" />
            <span>Observed UK</span>
          </button>
          <button
            type="button"
            onClick={() => setShowRrp((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2 py-1 border cursor-pointer transition-colors ${
              showRrp
                ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-zinc-700 dark:bg-zinc-300 inline-block" />
            <span>Target RRP</span>
          </button>
          <button
            type="button"
            onClick={() => setShowWholesale((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2 py-1 border cursor-pointer transition-colors ${
              showWholesale
                ? 'border-emerald-600/60 bg-emerald-500/10 text-black dark:text-white font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" />
            <span>1P Cost</span>
          </button>
        </div>
      </div>

      {/* Live Readout KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px]">
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">
            {hoveredIdx !== null ? `${activePoint.monthLabel} Observed` : 'Current Amazon UK'}
          </div>
          <div className="font-mono tabular-nums font-bold text-[#FF6A00] text-xs mt-0.5">
            £{activePoint.observedUkPriceGbp.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">Target UK RRP</div>
          <div className="font-mono tabular-nums font-semibold text-black dark:text-white text-xs mt-0.5">
            £{activePoint.targetRrpGbp.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">1P Cost / Margin</div>
          <div className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">
            £{activePoint.wholesaleCostGbp.toFixed(2)} (+£{activeMargin.toFixed(2)} · {marginPct}%)
          </div>
        </div>
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">
            {hoveredIdx !== null ? 'Month Drift vs RRP' : 'Spot Drift / 12M Delta'}
          </div>
          <div className="font-mono tabular-nums font-semibold text-black dark:text-white text-xs mt-0.5">
            {activeDrift >= 0 ? `+£${activeDrift.toFixed(2)}` : `-£${Math.abs(activeDrift).toFixed(2)}`}{' '}
            ({driftPct >= 0 ? `+${driftPct}%` : `${driftPct}%`}) · 12M{' '}
            {yoyChangePct >= 0 ? `+${yoyChangePct}%` : `${yoyChangePct}%`}
          </div>
        </div>
      </div>

      {/* Responsive SVG Line Chart */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`12 month UK price history chart for ${sku.name}`}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Horizontal Grid Lines & Y-Axis GBP Labels */}
          {yTicks.map((val, i) => {
            const y = getY(val);
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-zinc-200 dark:text-zinc-800"
                  strokeWidth={0.8}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-500 dark:fill-zinc-400 text-[10px] font-mono"
                >
                  £{val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Shaded 1P Margin Headroom Band */}
          {showRrp && showWholesale && (
            <polygon
              points={marginAreaPoints}
              fill="#10B981"
              fillOpacity={0.08}
            />
          )}

          {/* 1P Wholesale Cost Floor (emerald dotted) */}
          {showWholesale && (
            <path
              d={toPath((pt) => pt.wholesaleCostGbp)}
              fill="none"
              stroke="#059669"
              strokeWidth={1.7}
              strokeDasharray="3 3"
            />
          )}

          {/* Target UK RRP (charcoal/slate dashed) */}
          {showRrp && (
            <path
              d={toPath((pt) => pt.targetRrpGbp)}
              fill="none"
              stroke="currentColor"
              className="text-zinc-700 dark:text-zinc-300"
              strokeWidth={1.8}
              strokeDasharray="6 4"
            />
          )}

          {/* Observed Amazon UK Price (#FF6A00 solid) */}
          {showObserved && (
            <path
              d={toPath((pt) => pt.observedUkPriceGbp)}
              fill="none"
              stroke="#FF6A00"
              strokeWidth={2.3}
            />
          )}

          {/* Hover Vertical Crosshair */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={padTop}
              x2={getX(hoveredIdx)}
              y2={height - padBottom}
              stroke="#FF6A00"
              strokeOpacity={0.5}
              strokeWidth={1}
              strokeDasharray="3 2"
            />
          )}

          {/* Monthly Data Points + X-Axis Labels + Invisible Hover Columns */}
          {series.map((pt, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIdx === idx;
            const colW = plotW / Math.max(1, series.length - 1);

            return (
              <g key={pt.monthLabel}>
                {showObserved && (
                  <circle
                    cx={x}
                    cy={getY(pt.observedUkPriceGbp)}
                    r={isHovered ? 4.5 : 2.8}
                    fill="#FF6A00"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                )}
                {showRrp && isHovered && (
                  <circle
                    cx={x}
                    cy={getY(pt.targetRrpGbp)}
                    r={3.5}
                    fill="currentColor"
                    className="text-zinc-800 dark:text-zinc-200"
                  />
                )}
                {showWholesale && isHovered && (
                  <circle
                    cx={x}
                    cy={getY(pt.wholesaleCostGbp)}
                    r={3.5}
                    fill="#059669"
                  />
                )}

                {/* X-axis label (show every 2nd month on compact or all 12 on full) */}
                {(!compact || idx % 2 === 0 || idx === series.length - 1) && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className={`text-[9.5px] font-mono ${
                      isHovered
                        ? 'fill-[#FF6A00] font-bold'
                        : 'fill-zinc-500 dark:fill-zinc-400'
                    }`}
                  >
                    {pt.monthLabel}
                  </text>
                )}

                {/* Wide hover target column */}
                <rect
                  x={x - colW / 2}
                  y={padTop}
                  width={colW}
                  height={plotH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Transparency & Active Month Channel Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>
          <strong className="text-black dark:text-white">{activePoint.monthLabel}:</strong>{' '}
          {activePoint.channelNote}
        </span>
        <span>
          Current 1P Cost, Target RRP &amp; Amazon UK spot price are anchored; 12M curve models UK seasonal &amp; 3P variance.
        </span>
      </div>
    </div>
  );
};
