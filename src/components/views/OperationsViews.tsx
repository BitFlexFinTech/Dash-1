import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, Warehouse } from 'lucide-react';
import {
  COMPLIANCE_RECORDS,
  IMPORT_EXCISE_RECORDS,
  INVENTORY_ITEMS,
  WET_BOND_PARTNERS,
  WHOLESALE_ORDERS,
} from '../../data/bwsData';
import { MetricStrip, PrototypeBannerNote, SectionHeader } from '../ui/SharedPrimitives';

/* ============================================================================
 * 16. COMPLIANCE & REGULATORY
 * ========================================================================== */
export const ComplianceRegulatoryView: React.FC = () => {
  const [filter, setFilter] = useState('All');

  const rows = COMPLIANCE_RECORDS.filter(
    (r) => filter === 'All' || r.regulatoryReviewStatus === filter
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="UK Alcohol Governance"
        title="Compliance & Regulatory"
        description="UK alcoholic beverage readiness tracker covering AWRS checks, beverage classification, UK ABV & allergen labelling, duty stamps, and 18+ Challenge-25 Vendor Central UK (1P) fulfilment controls."
        actions={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter compliance status"
            className="px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
          >
            <option value="All">All Review Statuses</option>
            <option value="Cleared (Prototype Sample)">Cleared (Prototype Sample)</option>
            <option value="Action Required">Action Required</option>
            <option value="In Review">In Review</option>
          </select>
        }
      />

      <PrototypeBannerNote text="Operational compliance log covering HMRC AWRS, GB importer text, UK Duty Stamp rules (>30% ABV containers >=350ml), and ASA/CAP Code Section 18 readiness." />

      <MetricStrip
        items={[
          {
            label: 'SKUs Under Review',
            value: String(COMPLIANCE_RECORDS.length),
            detail: 'Active UK compliance logs',
          },
          {
            label: 'Cleared Samples',
            value: String(
              COMPLIANCE_RECORDS.filter(
                (c) => c.regulatoryReviewStatus === 'Cleared (Prototype Sample)'
              ).length
            ),
            detail: 'AWRS & UK label checked',
            highlight: true,
          },
          {
            label: 'Labelling Actions Required',
            value: String(
              COMPLIANCE_RECORDS.filter((c) => c.labellingCheck === 'Requires UK Strip Label')
                .length
            ),
            detail: 'English allergen & GB importer text',
          },
          {
            label: 'Age-Restricted Protocol',
            value: '18+ Active',
            detail: 'Challenge-25 Amazon 1P & DHL delivery',
          },
        ]}
      />

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
              <th className="py-3 px-4">Brand & Product</th>
              <th className="py-3 px-4">Classification & ABV</th>
              <th className="py-3 px-4">AWRS / Licensing</th>
              <th className="py-3 px-4">Labelling & Packaging</th>
              <th className="py-3 px-4">Responsible / Age Sales</th>
              <th className="py-3 px-4">Documentation</th>
              <th className="py-3 px-4">Review Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {rows.map((rec) => (
              <tr key={rec.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                <td className="py-3.5 px-4 min-w-[200px]">
                  <div className="font-semibold text-black dark:text-white">{rec.brandName}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {rec.productName}
                  </div>
                </td>
                <td className="py-3.5 px-4 min-w-[160px]">
                  <div className="text-black dark:text-white">{rec.classification}</div>
                  <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    Declared: {rec.abvDeclared}
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                  {rec.awrsCheck}
                </td>
                <td className="py-3.5 px-4 min-w-[220px]">
                  <div className="font-medium text-black dark:text-white">{rec.labellingCheck}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {rec.packagingCompliance}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 min-w-[190px]">
                  {rec.ageRestrictionNotice}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                  {rec.documentationStatus}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#FF6A00]">
                  {rec.regulatoryReviewStatus}
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
 * 17. IMPORT & EXCISE (WET-BOND vs WEPREP NON-BONDED + INSURANCE / TERMS EXPLAINER)
 * ========================================================================== */
export const ImportExciseView: React.FC = () => {
  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Cross-Border Freight, HMRC Excise & Bonded Storage"
        title="Import, 3P Wet-Bond & WePrep Duty-Paid Operations"
        description="Because WePrep UK (Ipswich) operates strictly as a non-bonded duty-paid Vendor Central 1P prep facility, duty-suspended EU/RoW bulk stock holds in a 3P HMRC Wet-Bond until called off duty-paid."
      />

      <PrototypeBannerNote text="Note: HMRC repealed legacy WOWGR 'Owner of Goods' certificates—you only need UK Ltd + GB EORI + AWRS URN (for duty-paid B2B trading), UKWA Goods-in-Bond stock insurance, and Pro-Forma or Direct Debit warehouse terms." />

      <MetricStrip
        items={[
          {
            label: 'Active Inbound Shipments',
            value: String(IMPORT_EXCISE_RECORDS.length),
            detail: 'PL, ZA, JP & IT corridors',
          },
          {
            label: 'Docs Verified',
            value: String(
              IMPORT_EXCISE_RECORDS.filter((r) => r.importDocsStatus === 'Verified').length
            ),
            detail: 'VI-1, Origin & EMCS ARC matched',
            highlight: true,
          },
          {
            label: '3P Wet-Bond Suspended',
            value: String(
              IMPORT_EXCISE_RECORDS.filter(
                (r) => r.exciseDutyStatus === '3P Wet-Bond Suspension'
              ).length
            ),
            detail: 'EHD London No. 1 & Seabrook',
          },
          {
            label: 'Ready for WePrep Release',
            value: String(
              IMPORT_EXCISE_RECORDS.filter((r) => r.importReadiness === 'Ready for WePrep Release')
                .length
            ),
            detail: 'Duty-paid 1P ASN prep ready',
            highlight: true,
          },
        ]}
      />

      {/* Plain-English Guide to Direct Debit, Pro-Forma & UKWA Goods-in-Bond Insurance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-black dark:text-white">
            <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
            <span>Direct Debit & Credit vs. Pro-Forma Terms</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Wet-bonds run a free trade credit check if you want 14–30 day credit invoices settled by{' '}
            <strong className="text-black dark:text-white">Direct Debit mandate</strong> (signed PDF via GoCardless/bank form). If your Ltd company is new, pick{' '}
            <strong className="text-[#FF6A00]">Pro-Forma terms</strong> (£0 credit lock)—you simply pay storage/handling upfront before stock release.
          </p>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-black dark:text-white">
            <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
            <span>UKWA Goods-in-Bond Stock Insurance</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Warehouses operating under <strong className="text-black dark:text-white">UKWA terms</strong> cap carrier liability (~£100/tonne). You must hold marine/warehouse stock cover protecting{' '}
            <strong className="text-black dark:text-white">both product cost + contingent HMRC excise duty</strong> (~£600–£1,500/yr via Wine2Insure or Fidentia).
          </p>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-black dark:text-white">
            <Warehouse className="w-4 h-4 text-[#FF6A00]" />
            <span>WePrep UK (Non-Bonded Duty-Paid Entry)</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <strong className="text-black dark:text-white">WePrep (Ipswich)</strong> has no HMRC excise bond. Stock enters WePrep only after duty is settled (either via UK distiller, DHL Credit customs clearance, or call-off from your 3P Wet-Bond).
          </p>
        </div>
      </div>

      {/* 3P Wet-Bond Partner Comparison Cards */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            Vetted 3P UK Wet-Bond Partners (Duty-Suspended Storage → WePrep Call-Off)
          </h2>
          <span className="text-xs font-mono text-[#FF6A00]">Official Onboarding Portals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WET_BOND_PARTNERS.map((wb) => (
            <div
              key={wb.id}
              className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between gap-3 text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-black dark:text-white text-sm">{wb.name}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{wb.location}</div>
                  </div>
                  <span className="font-mono text-[10px] text-[#FF6A00] shrink-0">
                    {wb.estimatedTimeline}
                  </span>
                </div>
                <div className="font-medium text-black dark:text-white">Best for: {wb.bestFor}</div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  {wb.onboardingRequirements.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">{wb.notes}</p>
              </div>
              <a
                href={wb.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#FF6A00] hover:underline pt-2 border-t border-zinc-200 dark:border-zinc-800"
              >
                <span>Open {wb.name} Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Active Import & Bond Ledger */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Origin & Supplier</th>
              <th className="py-3 px-4">Product Summary</th>
              <th className="py-3 px-4">Bond / WePrep Facility</th>
              <th className="py-3 px-4">Customs</th>
              <th className="py-3 px-4">Excise Status</th>
              <th className="py-3 px-4">Readiness & Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {IMPORT_EXCISE_RECORDS.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                <td className="py-3.5 px-4 font-mono font-semibold text-black dark:text-white whitespace-nowrap">
                  {row.shipmentRef}
                </td>
                <td className="py-3.5 px-4 min-w-[180px]">
                  <div className="font-semibold text-black dark:text-white">
                    {row.countryOfOrigin}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{row.supplier}</div>
                </td>
                <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 min-w-[200px]">
                  {row.productSummary}
                </td>
                <td className="py-3.5 px-4 font-medium text-black dark:text-white min-w-[190px]">
                  {row.bondFacility}
                </td>
                <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  {row.customsStatus}
                </td>
                <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  {row.exciseDutyStatus}
                </td>
                <td className="py-3.5 px-4 min-w-[240px]">
                  <div className="font-semibold text-[#FF6A00]">{row.importReadiness}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {row.shipmentStatus} · {row.outstandingItems}
                  </div>
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
 * 18. WHOLESALE DISTRIBUTION (VENDOR CENTRAL 1P & DHL DIRECT-SHIP)
 * ========================================================================== */
export const WholesaleDistributionView: React.FC = () => {
  const [orderType, setOrderType] = useState('All');

  const orders = WHOLESALE_ORDERS.filter((o) => orderType === 'All' || o.type === orderType);

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Trade & Vendor Central 1P Operations"
        title="Wholesale Distribution & Amazon 1P PO Dispatches"
        description="Operational view of Amazon Vendor Central UK (1P) purchase orders, WePrep 1P ASN & SSCC pallet prep, Mercenta DHL Credit direct-ship dispatches, and inbound producer shipments."
        actions={
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            aria-label="Filter order type"
            className="px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
          >
            <option value="All">All Order Types</option>
            <option value="Amazon Vendor Central PO (1P)">Amazon Vendor Central POs (1P)</option>
            <option value="Inbound Supplier PO">Inbound Supplier POs</option>
          </select>
        }
      />

      <PrototypeBannerNote text="Zero FBA—all Amazon dispatches shown fulfill Amazon Vendor Central UK (1P) POs to UK Fulfilment Centres (BHX4, MAN2, LTN4, BRS1)." />

      <MetricStrip
        items={[
          {
            label: 'Active Orders Shown',
            value: String(orders.length),
            detail: 'Vendor Central 1P POs + Inbound',
          },
          {
            label: 'Total Case Volume',
            value: String(orders.reduce((a, b) => a + b.casesCount, 0)),
            detail: '6-bottle & 12-bottle trade cases',
            highlight: true,
          },
          {
            label: 'Illustrative Order Value',
            value: `£${orders.reduce((a, b) => a + b.illustrativeValueGbp, 0).toLocaleString()}`,
            detail: '1P Wholesale PO value',
          },
          {
            label: 'Active UK Hubs',
            value: 'WePrep + 3P Bond',
            detail: 'Ipswich WePrep, EHD, Seabrook & DHL Credit',
          },
        ]}
      />

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
              <th className="py-3 px-4">Order Ref</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Counterparty / Amazon FC</th>
              <th className="py-3 px-4">Brand</th>
              <th className="py-3 px-4 text-right">Cases</th>
              <th className="py-3 px-4 text-right">Est. Value</th>
              <th className="py-3 px-4">Fulfilment Route</th>
              <th className="py-3 px-4">Fulfilment & Tracking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {orders.map((ord) => (
              <tr key={ord.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                <td className="py-3.5 px-4 font-mono font-semibold text-black dark:text-white whitespace-nowrap">
                  {ord.orderNumber}
                </td>
                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                  {ord.type}
                </td>
                <td className="py-3.5 px-4 font-medium text-black dark:text-white min-w-[200px]">
                  {ord.counterparty}
                </td>
                <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  {ord.brandName}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-black dark:text-white">
                  {ord.casesCount}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-black dark:text-white">
                  £{ord.illustrativeValueGbp.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {ord.warehouse}
                </td>
                <td className="py-3.5 px-4 min-w-[180px]">
                  <div className="font-semibold text-[#FF6A00]">{ord.fulfilmentStatus}</div>
                  <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    {ord.deliveryTracking} · {ord.date}
                  </div>
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
 * 19. INVENTORY & FULFILMENT (WEPREP DUTY-PAID + 3P WET-BOND + VENDOR CENTRAL 1P)
 * ========================================================================== */
export const InventoryFulfilmentView: React.FC = () => {
  const onHandTotal = INVENTORY_ITEMS.reduce((a, b) => a + b.onHandCases, 0);
  const incomingTotal = INVENTORY_ITEMS.reduce((a, b) => a + b.incomingCases, 0);
  const lowStockCount = INVENTORY_ITEMS.filter(
    (i) => i.stockHealth === 'Low Stock' || i.stockHealth === 'Reorder Triggered'
  ).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Warehouse Stock & 1P Allocation"
        title="Inventory & Fulfilment"
        description="UK 3P wet-bond (duty-suspended) and WePrep Ipswich (duty-paid) stock allocations serving Wholesale Trade and Amazon Vendor Central UK (1P) PO fulfilment."
      />

      <MetricStrip
        items={[
          {
            label: 'On-Hand Cases',
            value: String(onHandTotal),
            detail: 'WePrep Duty-Paid + 3P Wet-Bond',
            highlight: true,
          },
          {
            label: 'Incoming Inbound Cases',
            value: String(incomingTotal),
            detail: 'Scheduled DHL & container arrivals',
          },
          {
            label: 'Low Stock / Call-Off Alerts',
            value: String(lowStockCount),
            detail: 'Requires duty-paid call-off to WePrep',
          },
          {
            label: 'Tracked SKUs',
            value: String(INVENTORY_ITEMS.length),
            detail: 'Amazon Vendor Central 1P lines',
          },
        ]}
      />

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
              <th className="py-3 px-4">SKU Code</th>
              <th className="py-3 px-4">Brand & Product</th>
              <th className="py-3 px-4">Facility (WePrep vs. 3P Bond)</th>
              <th className="py-3 px-4 text-right">On Hand</th>
              <th className="py-3 px-4 text-right">Allocated</th>
              <th className="py-3 px-4 text-right">Available</th>
              <th className="py-3 px-4 text-right">Incoming</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">Stock Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {INVENTORY_ITEMS.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                <td className="py-3.5 px-4 font-mono font-semibold text-black dark:text-white whitespace-nowrap">
                  {item.skuCode}
                </td>
                <td className="py-3.5 px-4 min-w-[220px]">
                  <div className="font-semibold text-black dark:text-white">{item.brandName}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {item.productName}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                  {item.warehouse}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-black dark:text-white">
                  {item.onHandCases}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                  {item.allocatedCases}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-black dark:text-white">
                  {item.availableCases}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#FF6A00]">
                  +{item.incomingCases}
                </td>
                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                  {item.fulfilmentChannel}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap font-semibold">
                  <span
                    className={
                      item.stockHealth === 'Optimal'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : item.stockHealth === 'Reorder Triggered' ||
                          item.stockHealth === 'Low Stock'
                        ? 'text-[#FF6A00]'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }
                  >
                    {item.stockHealth}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
