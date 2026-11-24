import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckSquare,
  FileSearch,
  HelpCircle,
  MinusSquare,
  Wine,
} from 'lucide-react';
import { EvidenceRecord, OpportunityStatus, VerificationStatus } from '../../types/bws';

export const SectionHeader: React.FC<{
  kicker?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}> = ({ kicker, title, description, actions }) => (
  <div className="flex flex-col gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl">
      {kicker && (
        <div className="text-xs font-medium tracking-wide text-[#FF6A00] mb-1.5">
          {kicker}
        </div>
      )}
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-black dark:text-white text-balance">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
  </div>
);

export const MetricStrip: React.FC<{
  items: {
    label: string;
    value: string;
    detail?: string;
    highlight?: boolean;
  }[];
}> = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D] divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800">
    {items.map((item) => (
      <div key={item.label} className="p-5 flex flex-col justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {item.label}
        </span>
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
              item.highlight ? 'text-[#FF6A00]' : 'text-black dark:text-white'
            }`}
          >
            {item.value}
          </span>
        </div>
        {item.detail && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {item.detail}
          </span>
        )}
      </div>
    ))}
  </div>
);

export const VerificationLabel: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  const config: Record<
    VerificationStatus,
    { icon: React.ReactNode; textClass: string }
  > = {
    Verified: {
      icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      textClass: 'text-emerald-700 dark:text-emerald-400',
    },
    'Partially Verified': {
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
      textClass: 'text-amber-700 dark:text-amber-400',
    },
    'Requires Verification': {
      icon: <FileSearch className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />,
      textClass: 'text-[#FF6A00]',
    },
    'Not Found in Reviewed Sources': {
      icon: <MinusSquare className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />,
      textClass: 'text-zinc-600 dark:text-zinc-400',
    },
    Unknown: {
      icon: <HelpCircle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />,
      textClass: 'text-zinc-600 dark:text-zinc-400',
    },
  };

  const current = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${current.textClass}`}>
      {current.icon}
      <span>{status}</span>
    </span>
  );
};

export const OpportunityStatusText: React.FC<{ status: OpportunityStatus }> = ({ status }) => {
  const colorMap: Record<OpportunityStatus, string> = {
    'High Potential': 'text-[#FF6A00]',
    'Worth Investigating': 'text-emerald-700 dark:text-emerald-400',
    'Existing UK Representation': 'text-zinc-700 dark:text-zinc-300',
    'Distribution Status Unclear': 'text-amber-700 dark:text-amber-400',
    'Requires Further Research': 'text-amber-700 dark:text-amber-400',
    'Not Suitable': 'text-zinc-500 dark:text-zinc-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${colorMap[status]}`}>
      <span
        className={`w-1.5 h-1.5 shrink-0 ${
          status === 'High Potential'
            ? 'bg-[#FF6A00]'
            : status === 'Worth Investigating'
            ? 'bg-emerald-600 dark:bg-emerald-400'
            : status === 'Not Suitable'
            ? 'bg-zinc-400 dark:bg-zinc-600'
            : 'bg-amber-500'
        }`}
      />
      <span>{status}</span>
    </span>
  );
};

export const ProductVisual: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'w-full h-44 object-contain bg-white dark:bg-zinc-950 p-2' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 p-4 ${className}`}
      >
        <Wine className="w-7 h-7 text-[#FF6A00] mb-2" />
        <span className="text-xs text-center font-medium line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const EvidenceLedger: React.FC<{
  records: EvidenceRecord[];
  title?: string;
}> = ({ records, title = 'Evidence & Source Verification Ledger' }) => {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B0D]">
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-black dark:text-white">{title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Illustrative source audit distinguishing confirmed findings from unverified claims.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
          {records.length} {records.length === 1 ? 'record' : 'records'} reviewed
        </span>
      </div>
      {records.length === 0 ? (
        <div className="p-6 text-xs text-zinc-500 dark:text-zinc-400">
          No reviewed source records attached to this selection yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60">
                <th className="py-2.5 px-4">Source Name</th>
                <th className="py-2.5 px-4">Source Type</th>
                <th className="py-2.5 px-4">Source Date</th>
                <th className="py-2.5 px-4">Reviewed</th>
                <th className="py-2.5 px-4">What Source Supports</th>
                <th className="py-2.5 px-4">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {records.map((ev) => (
                <tr key={ev.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-black dark:text-white min-w-[200px]">
                    {ev.sourceName}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                    {ev.sourceType}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {ev.sourceDate}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {ev.dateReviewed}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 min-w-[260px]">
                    {ev.supports}
                  </td>
                  <td className="py-3 px-4">
                    <VerificationLabel status={ev.verificationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const PrototypeBannerNote: React.FC<{ text: string }> = ({ text }) => (
  <div className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between gap-4">
    <span>{text}</span>
    <span className="font-mono text-[11px] text-[#FF6A00] whitespace-nowrap shrink-0">
      Illustrative Data
    </span>
  </div>
);
