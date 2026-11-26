import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw, Search, X } from 'lucide-react';
import type { DataMode, MatchFormat, MatchStatus, MatchSummary } from '../types/cricket';
import { FeaturedMatchCard } from './FeaturedMatchCard';
import { MatchCard } from './MatchCard';

export type StatusFilter = 'all' | MatchStatus;
export type FormatFilter = 'all' | MatchFormat;

interface MatchDiscoveryProps {
  matches: MatchSummary[];
  mode: DataMode | 'connecting';
  statusFilter: StatusFilter;
  onStatusFilterChange: (f: StatusFilter) => void;
  onOpenMatch: (matchId: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  isStale: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  apiNotice?: string;
}

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

const FORMAT_OPTIONS: { id: FormatFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'T20', label: 'T20' },
  { id: 'ODI', label: 'ODI' },
  { id: 'Test', label: 'Test' },
];

function formatClock(date: Date | null): string {
  if (!date) return 'Syncing...';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MatchDiscovery: React.FC<MatchDiscoveryProps> = ({
  matches,
  mode,
  statusFilter,
  onStatusFilterChange,
  onOpenMatch,
  isLoading,
  isFetching,
  isStale,
  lastUpdated,
  onRefresh,
  apiNotice,
}) => {
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [tournamentFilter, setTournamentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tournaments = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matches) {
      map.set(m.tournamentId, m.tournamentName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [matches]);

  const featuredMatch = useMemo(() => {
    if (statusFilter === 'upcoming' || statusFilter === 'completed') return null;
    if (formatFilter !== 'all' || tournamentFilter !== 'all' || searchQuery.trim()) {
      return null;
    }
    if (statusFilter === 'live') {
      return matches.find((m) => m.status === 'live') ?? null;
    }
    return (
      matches.find((m) => m.isFeatured && m.status === 'live') ??
      matches.find((m) => m.status === 'live') ??
      matches.find((m) => m.isFeatured) ??
      matches[0] ??
      null
    );
  }, [matches, statusFilter, formatFilter, tournamentFilter, searchQuery]);

  const filteredMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return matches.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (formatFilter !== 'all' && m.format !== formatFilter) return false;
      if (tournamentFilter !== 'all' && m.tournamentId !== tournamentFilter) return false;
      if (q) {
        const hay = [
          m.teamA.name,
          m.teamB.name,
          m.teamA.shortName,
          m.teamB.shortName,
          m.tournamentName,
          m.venue.name,
          m.venue.city ?? '',
          m.format,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [matches, statusFilter, formatFilter, tournamentFilter, searchQuery]);

  const gridMatches = useMemo(() => {
    if (!featuredMatch) return filteredMatches;
    return filteredMatches.filter((m) => m.id !== featuredMatch.id);
  }, [filteredMatches, featuredMatch]);

  const sectionHeading =
    statusFilter === 'live'
      ? 'Live Matches'
      : statusFilter === 'upcoming'
        ? 'Upcoming Fixtures'
        : statusFilter === 'completed'
          ? 'Completed Results'
          : 'Matches';

  const hasActiveFilters =
    statusFilter !== 'all' ||
    formatFilter !== 'all' ||
    tournamentFilter !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Clean Minimal Page Header (inline update time + refresh, no bulky status card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            {sectionHeading}
          </h1>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            Live scores, commentary, and full scorecards across T20, ODI, and Test cricket.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#71717A]">
          <span className="font-mono tabular-nums">
            {filteredMatches.length} match{filteredMatches.length === 1 ? '' : 'es'}
          </span>
          <span aria-hidden="true" className="text-[#3F3F46]">·</span>
          <span className="font-mono tabular-nums">
            {formatClock(lastUpdated)}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Refresh match data"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#131317] px-2.5 py-1.5 text-xs font-medium text-[#FAFAFA] transition-colors hover:border-[#38BDF8]/40 hover:text-[#38BDF8] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Contextual Notice (only shown for Demo Mode, delayed feed, or API warning) */}
      {(mode === 'demo' || isStale || (apiNotice && mode === 'live')) && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-[#F59E0B]/25 bg-[#F59E0B]/[0.07] px-4 py-2.5 text-xs text-[#F59E0B]"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {mode === 'demo'
              ? 'Demo Mode active — displaying fictional teams and simulated live scores.'
              : isStale
                ? 'Feed delayed — displaying last verified score.'
                : apiNotice}
          </span>
        </div>
      )}

      {/* Featured Match Showcase */}
      {isLoading && matches.length === 0 ? (
        <div className="h-56 animate-pulse rounded-2xl bg-[#131317]" />
      ) : (
        featuredMatch && (
          <FeaturedMatchCard match={featuredMatch} onOpenMatch={onOpenMatch} />
        )
      )}

      {/* Flat, Airy Filter Row (no nested box) */}
      <section
        aria-label="Filter matches"
        className="flex flex-col gap-3 border-b border-white/[0.07] pb-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Status segmented control */}
          <div
            role="group"
            aria-label="Filter by match status"
            className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#111114] p-1 overflow-x-auto"
          >
            {STATUS_OPTIONS.map((opt) => {
              const active = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onStatusFilterChange(opt.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#1D1D24] text-[#38BDF8]'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Format segmented control */}
          <div
            role="group"
            aria-label="Filter by cricket format"
            className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#111114] p-1 overflow-x-auto"
          >
            {FORMAT_OPTIONS.map((opt) => {
              const active = formatFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormatFilter(opt.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#1D1D24] text-[#FAFAFA]'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tournament select + Search input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <label className="sr-only" htmlFor="tournament-filter">
            Filter by tournament
          </label>
          <select
            id="tournament-filter"
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
            className="h-9 rounded-xl border border-white/[0.08] bg-[#111114] px-3 text-xs text-[#FAFAFA] focus:border-[#38BDF8]/50 focus:outline-none"
          >
            <option value="all">All Tournaments</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter teams or venues..."
              aria-label="Filter matches by team or venue"
              className="h-9 w-full rounded-xl border border-white/[0.08] bg-[#111114] pl-8 pr-8 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:border-[#38BDF8]/50 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear match search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Animated Matches Grid */}
      {isLoading && matches.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((s) => (
            <div key={s} className="h-44 animate-pulse rounded-2xl bg-[#131317]" />
          ))}
        </div>
      ) : gridMatches.length === 0 && !featuredMatch ? (
        <div className="bl-card p-10 text-center">
          <p className="font-display text-base font-semibold text-[#FAFAFA]">
            No matches found
          </p>
          <p className="mt-1 text-sm text-[#71717A]">
            {statusFilter === 'live'
              ? 'No matches are currently in play. Check Upcoming or Results.'
              : 'Try another cricket format, tournament, or clear your search.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onStatusFilterChange('all');
                setFormatFilter('all');
                setTournamentFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 rounded-xl bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-[#09090B] transition-colors hover:bg-white"
            >
              Show All Matches
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {featuredMatch && gridMatches.length > 0 && (
            <h2 className="font-display text-sm font-semibold text-[#A1A1AA]">
              More Matches &amp; Fixtures
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {gridMatches.map((m, idx) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  index={idx}
                  onOpenMatch={onOpenMatch}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
