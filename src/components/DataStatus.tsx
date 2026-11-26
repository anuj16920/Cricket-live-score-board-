import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { DataMode } from '../types/cricket';

interface DataStatusProps {
  mode: DataMode | 'connecting';
  lastUpdated: Date | null;
  isStale: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  notice?: string;
}

function formatClock(date: Date | null): string {
  if (!date) return 'Syncing...';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const DataStatus: React.FC<DataStatusProps> = ({
  mode,
  lastUpdated,
  isStale,
  isFetching,
  onRefresh,
  notice,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#A1A1AA]"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className={`font-mono font-semibold tracking-wider ${
            mode === 'live'
              ? 'text-[#34D399]'
              : mode === 'demo'
                ? 'text-[#F59E0B]'
                : 'text-[#71717A]'
          }`}
        >
          {mode === 'connecting' ? 'SYNCING' : mode === 'demo' ? 'DEMO MODE' : 'LIVE API'}
        </span>
        {mode === 'demo' && (
          <>
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="text-[#A1A1AA]">Fictional teams &amp; simulated feed</span>
          </>
        )}
        {isStale && (
          <>
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="inline-flex items-center gap-1 text-[#F59E0B]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Feed delayed</span>
            </span>
          </>
        )}
        {notice && mode === 'live' && (
          <>
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="text-[#F59E0B]">{notice}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono tabular-nums text-[#71717A]">
          {formatClock(lastUpdated)}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#131317] px-2.5 py-1 text-xs font-medium text-[#FAFAFA] transition-colors hover:border-[#38BDF8]/40 hover:text-[#38BDF8] disabled:opacity-60 whitespace-nowrap shrink-0"
          aria-label="Refresh match data"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};
