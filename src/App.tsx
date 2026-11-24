import { useEffect, useState } from 'react';
import {
  ADMIN_LAUNCH_CHECKLIST,
  BRANDS,
  COUNTRIES,
  DEFAULT_AI_ROUTING,
  DISTILLER_DIRECTORY,
  INITIAL_OUTREACH_LOGS,
  INITIAL_VENDOR_CENTRAL_POS,
  PRODUCTS,
} from './data/bwsData';
import {
  AiModelRoutingConfig,
  AiTaskSlot,
  BrandProfile,
  CampaignDraft,
  ChecklistStatus,
  DistillerManufacturerRecord,
  DrinkCategory,
  NavSectionId,
  OutreachLogRecord,
  ProductSku,
  VendorCentralPoRecord,
} from './types/bws';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { OverviewView } from './components/views/OverviewView';
import { CountryDiscoveryView } from './components/views/CountryDiscoveryView';
import { BrandDiscoveryView } from './components/views/BrandDiscoveryView';
import { BrandIntelligenceView } from './components/views/BrandIntelligenceView';
import {
  AcquisitionPipelineView,
  AmazonUkView,
  OnePPitchTargetsView,
  OpportunityAssessmentView,
  UkDistributionView,
} from './components/views/IntelligenceWorkspaces';
import {
  BrandOnboardingView,
  BrandPortfolioView,
  ProductCatalogueView,
} from './components/views/CommercialPortfolioViews';
import { PartnerPortalView } from './components/views/PartnerPortalView';
import {
  ComplianceRegulatoryView,
  ImportExciseView,
  InventoryFulfilmentView,
  WholesaleDistributionView,
} from './components/views/OperationsViews';
import { CampaignStudioView } from './components/views/CampaignStudioView';
import {
  BrandGrowthView,
  FinancialsView,
  ReportsAnalyticsView,
  SettingsView,
} from './components/views/GrowthAnalyticsViews';

function readStoredState<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const DEFAULT_CHECKLIST_STATUSES: Record<string, ChecklistStatus> = Object.fromEntries(
  ADMIN_LAUNCH_CHECKLIST.map((item) => [item.id, item.defaultStatus])
);

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeSection, setActiveSection] = useState<NavSectionId>('overview');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('sct');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('the-glenallachie');
  const [brandDiscoveryCountryFilter, setBrandDiscoveryCountryFilter] = useState<string>('All');
  const [brandDiscoveryCategoryFilter, setBrandDiscoveryCategoryFilter] = useState<DrinkCategory[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [brands, setBrands] = useState<BrandProfile[]>(() =>
    readStoredState('mercenta_bws_brands_v3', BRANDS)
  );
  const [distillers, setDistillers] = useState<DistillerManufacturerRecord[]>(() =>
    readStoredState('mercenta_bws_distillers_v3', DISTILLER_DIRECTORY)
  );
  const [skus, setSkus] = useState<ProductSku[]>(() =>
    readStoredState('mercenta_bws_skus_v3', PRODUCTS)
  );
  const [outreachLogs, setOutreachLogs] = useState<Record<string, OutreachLogRecord>>(() =>
    readStoredState('mercenta_bws_outreach_v2', INITIAL_OUTREACH_LOGS)
  );
  const [vendorCentralPos, setVendorCentralPos] = useState<VendorCentralPoRecord[]>(() =>
    readStoredState('mercenta_bws_vc_pos_v1', INITIAL_VENDOR_CENTRAL_POS)
  );
  const [checklistStatuses, setChecklistStatuses] = useState<Record<string, ChecklistStatus>>(() =>
    readStoredState('mercenta_bws_checklist_v1', DEFAULT_CHECKLIST_STATUSES)
  );
  const [aiRouting, setAiRouting] = useState<AiModelRoutingConfig>(() =>
    readStoredState('mercenta_bws_ai_routing_v1', DEFAULT_AI_ROUTING)
  );
  const [campaignDrafts, setCampaignDrafts] = useState<CampaignDraft[]>(() =>
    readStoredState('mercenta_bws_campaign_drafts_v1', [])
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_bws_brands_v3', JSON.stringify(brands));
    } catch {
      // ignore
    }
  }, [brands]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_bws_distillers_v3', JSON.stringify(distillers));
    } catch {
      // ignore
    }
  }, [distillers]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_bws_skus_v3', JSON.stringify(skus));
    } catch {
      // Ignore quota exceeded for very large uploaded images
    }
  }, [skus]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_bws_outreach_v2', JSON.stringify(outreachLogs));
    } catch {
      // ignore
    }
  }, [outreachLogs]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_bws_vc_pos_v1', JSON.stringify(vendorCentralPos));
    } catch {
      // ignore
    }
  }, [vendorCentralPos]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_bws_checklist_v1', JSON.stringify(checklistStatuses));
    } catch {
      // ignore
    }
  }, [checklistStatuses]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_bws_ai_routing_v1', JSON.stringify(aiRouting));
    } catch {
      // ignore
    }
  }, [aiRouting]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mercenta_bws_campaign_drafts_v1', JSON.stringify(campaignDrafts));
    } catch {
      // ignore
    }
  }, [campaignDrafts]);

  const selectedCountry = COUNTRIES.find((c) => c.id === selectedCountryId);
  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  const handleSelectCountryAndOpen = (countryId: string) => {
    setSelectedCountryId(countryId);
    setActiveSection('country-discovery');
  };

  const handleSelectBrandAndOpen = (brandId: string, target: NavSectionId = 'brand-intelligence') => {
    setSelectedBrandId(brandId);
    setActiveSection(target);
  };

  const handleOpenCountryInBrandDiscovery = (countryId: string) => {
    setBrandDiscoveryCountryFilter(countryId);
    setBrandDiscoveryCategoryFilter([]);
    setActiveSection('brand-discovery');
  };

  const handleOpenCategoryInBrandDiscovery = (category: DrinkCategory) => {
    setBrandDiscoveryCountryFilter('All');
    setBrandDiscoveryCategoryFilter([category]);
    setActiveSection('brand-discovery');
  };

  const handleNavigate = (section: NavSectionId) => {
    if (section === 'brand-discovery') {
      setBrandDiscoveryCountryFilter('All');
      setBrandDiscoveryCategoryFilter([]);
    }
    setActiveSection(section);
  };

  const handleUpdateSku = (updated: ProductSku) => {
    setSkus((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAddSku = (created: ProductSku) => {
    setSkus((prev) => [created, ...prev]);
  };

  const handleAddDiscoveredBrand = (payload: {
    brand: BrandProfile;
    distiller: DistillerManufacturerRecord;
    sku: ProductSku;
  }) => {
    setBrands((prev) =>
      prev.some((b) => b.id === payload.brand.id) ? prev : [payload.brand, ...prev]
    );
    setDistillers((prev) =>
      prev.some((d) => d.brandId === payload.brand.id) ? prev : [payload.distiller, ...prev]
    );
    setSkus((prev) =>
      prev.some((s) => s.id === payload.sku.id) ? prev : [payload.sku, ...prev]
    );
    setOutreachLogs((prev) =>
      prev[payload.brand.id]
        ? prev
        : {
            ...prev,
            [payload.brand.id]: {
              brandId: payload.brand.id,
              outreachStatus: 'Not Contacted',
              contactPerson: payload.distiller.exportContactRole,
              contactRole: payload.distiller.exportContactRole,
              contactEmail: payload.distiller.exportContactEmail,
              lastContacted: 'Not yet contacted',
              nextFollowUp: new Date().toISOString().slice(0, 10),
              discussionNotes: `Added via AI Discovery (${payload.brand.countryName}). ${payload.brand.nextAction}`,
            },
          }
    );
    setSelectedBrandId(payload.brand.id);
  };

  const handleUpdatePo = (updated: VendorCentralPoRecord) => {
    setVendorCentralPos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleUpdateOutreachLog = (record: OutreachLogRecord) => {
    setOutreachLogs((prev) => ({ ...prev, [record.brandId]: record }));
  };

  const handleUpdateChecklistStatus = (itemId: string, status: ChecklistStatus) => {
    setChecklistStatuses((prev) => ({ ...prev, [itemId]: status }));
  };

  const handleUpdateAiRouting = (slot: AiTaskSlot, modelId: string) => {
    if (slot === 'campaignCopy') return;
    setAiRouting((prev) => ({ ...prev, [slot]: modelId }));
  };

  const handleSaveCampaignDraft = (draft: CampaignDraft) => {
    setCampaignDrafts((prev) => [draft, ...prev]);
  };

  const handleResetAdminDefaults = () => {
    setChecklistStatuses(DEFAULT_CHECKLIST_STATUSES);
    setAiRouting(DEFAULT_AI_ROUTING);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewView
            selectedCountryId={selectedCountryId}
            brands={brands}
            countries={COUNTRIES}
            skus={skus}
            onSelectCountryAndOpen={handleSelectCountryAndOpen}
            onSelectBrandAndOpen={handleSelectBrandAndOpen}
            onOpenCategoryInBrandDiscovery={handleOpenCategoryInBrandDiscovery}
            onNavigate={handleNavigate}
          />
        );
      case 'country-discovery':
        return (
          <CountryDiscoveryView
            selectedCountryId={selectedCountryId}
            brands={brands}
            countries={COUNTRIES}
            skus={skus}
            onSelectCountry={setSelectedCountryId}
            onSelectBrandAndOpen={handleSelectBrandAndOpen}
            onOpenCountryInBrandDiscovery={handleOpenCountryInBrandDiscovery}
          />
        );
      case 'brand-discovery':
        return (
          <BrandDiscoveryView
            key={`${brandDiscoveryCountryFilter}-${brandDiscoveryCategoryFilter.join(',')}`}
            brands={brands}
            distillers={distillers}
            countries={COUNTRIES}
            initialCountryFilter={brandDiscoveryCountryFilter}
            initialCategoriesFilter={brandDiscoveryCategoryFilter}
            onSelectBrandAndOpen={handleSelectBrandAndOpen}
            onAddDiscoveredBrand={handleAddDiscoveredBrand}
          />
        );
      case 'brand-intelligence':
        return (
          <BrandIntelligenceView
            selectedBrandId={selectedBrandId}
            brands={brands}
            distillers={distillers}
            skus={skus}
            outreachLogs={outreachLogs}
            aiRouting={aiRouting}
            onSelectBrand={setSelectedBrandId}
            onNavigate={handleNavigate}
            onSelectCountryAndOpen={handleSelectCountryAndOpen}
            onUpdateOutreachLog={handleUpdateOutreachLog}
          />
        );
      case 'uk-distribution':
        return <UkDistributionView onSelectBrandAndOpen={handleSelectBrandAndOpen} />;
      case 'amazon-uk':
        return <AmazonUkView onSelectBrandAndOpen={handleSelectBrandAndOpen} />;
      case 'pitch-targets':
        return (
          <OnePPitchTargetsView
            brands={brands}
            distillers={distillers}
            skus={skus}
            outreachLogs={outreachLogs}
            onUpdateOutreachLog={handleUpdateOutreachLog}
            onAddDiscoveredBrand={handleAddDiscoveredBrand}
            aiRouting={aiRouting}
            onSelectBrandAndOpen={handleSelectBrandAndOpen}
          />
        );
      case 'opportunity-assessment':
        return (
          <OpportunityAssessmentView
            selectedBrandId={selectedBrandId}
            brands={brands}
            aiRouting={aiRouting}
            onSelectBrandAndOpen={handleSelectBrandAndOpen}
          />
        );
      case 'acquisition-pipeline':
        return (
          <AcquisitionPipelineView
            brands={brands}
            distillers={distillers}
            skus={skus}
            outreachLogs={outreachLogs}
            onUpdateOutreachLog={handleUpdateOutreachLog}
            aiRouting={aiRouting}
            onSelectBrandAndOpen={handleSelectBrandAndOpen}
          />
        );
      case 'brand-portfolio':
        return <BrandPortfolioView onSelectBrandAndOpen={handleSelectBrandAndOpen} />;
      case 'product-catalogue':
        return (
          <ProductCatalogueView
            skus={skus}
            onSelectBrandAndOpen={handleSelectBrandAndOpen}
          />
        );
      case 'brand-onboarding':
        return <BrandOnboardingView onSelectBrandAndOpen={handleSelectBrandAndOpen} />;
      case 'partner-portal':
        return (
          <PartnerPortalView
            brands={brands}
            skus={skus}
            onUpdateSku={handleUpdateSku}
            onAddSku={handleAddSku}
            vendorCentralPos={vendorCentralPos}
            onUpdatePo={handleUpdatePo}
          />
        );
      case 'compliance-regulatory':
        return <ComplianceRegulatoryView />;
      case 'import-excise':
        return <ImportExciseView />;
      case 'wholesale-distribution':
        return <WholesaleDistributionView />;
      case 'inventory-fulfilment':
        return <InventoryFulfilmentView />;
      case 'campaign-studio':
        return (
          <CampaignStudioView
            brands={brands}
            skus={skus}
            aiRouting={aiRouting}
            campaignDrafts={campaignDrafts}
            onSaveDraft={handleSaveCampaignDraft}
          />
        );
      case 'brand-growth':
        return <BrandGrowthView />;
      case 'financials':
        return <FinancialsView brands={brands} />;
      case 'reports-analytics':
        return <ReportsAnalyticsView />;
      case 'settings':
        return (
          <SettingsView
            theme={theme}
            onSetTheme={setTheme}
            checklistStatuses={checklistStatuses}
            onUpdateChecklistStatus={handleUpdateChecklistStatus}
            aiRouting={aiRouting}
            onUpdateAiRouting={handleUpdateAiRouting}
            onResetDefaults={handleResetAdminDefaults}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F7F7F8] dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          selectedCountryName={selectedCountry?.name}
          selectedBrandName={selectedBrand?.name}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
