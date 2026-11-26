import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Menu, Search, X, ArrowUpRight } from 'lucide-react';
import type { DataMode, MatchSummary } from '../types/cricket';
import { TeamBadge } from './TeamBadge';

export type NavSection = 'matches' | 'live' | 'upcoming' | 'results' | 'points' | 'about';

export interface AlertLogItem {
  id: string;
  title: string;
  subtitle: string;
  tone: 'default' | 'boundary' | 'wicket';
  time: string;
}

interface NavigationProps {
  activeSection: NavSection;
  isMatchDetailOpen: boolean;
  onSelectSection: (section: NavSection) => void;
  onSelectMatch: (matchId: string) => void;
  matches: MatchSummary[];
  mode: DataMode | 'connecting';
  alertsEnabled: boolean;
  onToggleAlerts: () => void;
  alertLog: AlertLogItem[];
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'matches', label: 'Matches' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
  { id: 'points', label: 'Points Table' },
  { id: 'about', label: 'About' },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  isMatchDetailOpen,
  onSelectSection,
  onSelectMatch,
  matches,
  mode,
  alertsEnabled,
  onToggleAlerts,
  alertLog,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setAlertsOpen(false);
        setMobileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredSearchMatches = matches.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      m.teamA.name.toLowerCase().includes(q) ||
      m.teamB.name.toLowerCase().includes(q) ||
      m.teamA.shortName.toLowerCase().includes(q) ||
      m.teamB.shortName.toLowerCase().includes(q) ||
      m.tournamentName.toLowerCase().includes(q) ||
      m.venue.name.toLowerCase().includes(q) ||
      m.format.toLowerCase().includes(q)
    );
  });

  const handleNavClick = (id: NavSection) => {
    onSelectSection(id);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#09090B]/95">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand mark */}
          <button
            type="button"
            onClick={() => handleNavClick('matches')}
            className="group flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:rounded-lg"
            aria-label="BOUNDARYLIVE Home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#131317] transition-colors group-hover:border-[#38BDF8]/45">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-[#38BDF8]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M6.4 6.8c3.6 2.8 7.6 6.8 10.4 10.4" strokeDasharray="2 1.8" />
                <path d="M7.8 5.4c3.6 2.8 7.6 6.8 10.4 10.4" strokeOpacity="0.4" />
              </svg>
            </span>
            <span className="font-display text-sm sm:text-base font-extrabold tracking-[0.06em] text-[#FAFAFA]">
              BOUNDARY<span className="text-[#38BDF8]">LIVE</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = !isMatchDetailOpen && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#FAFAFA]'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-underline"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-x-3 -bottom-[11px] h-[2px] rounded-full bg-[#38BDF8]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                setAlertsOpen(false);
              }}
              aria-label="Search matches and teams"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#131317] text-[#A1A1AA] transition-colors hover:border-white/20 hover:text-[#FAFAFA]"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAlertsOpen((prev) => !prev);
                  setSearchOpen(false);
                }}
                aria-label="Match notifications"
                aria-expanded={alertsOpen}
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  alertsOpen
                    ? 'border-[#38BDF8]/45 bg-[#18181D] text-[#38BDF8]'
                    : 'border-white/[0.08] bg-[#131317] text-[#A1A1AA] hover:border-white/20 hover:text-[#FAFAFA]'
                }`}
              >
                <Bell className="h-4 w-4" />
                {alertLog.length > 0 && alertsEnabled && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                )}
              </button>

              <AnimatePresence>
                {alertsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="bl-card-elevated absolute right-0 mt-2.5 w-80 max-w-[calc(100vw-2rem)] p-4 z-50"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <div>
                        <p className="font-display text-sm font-semibold text-[#FAFAFA]">
                          Match Alerts
                        </p>
                        <p className="text-xs text-[#71717A]">
                          Wickets &amp; boundary moments
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onToggleAlerts}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          alertsEnabled
                            ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                            : 'bg-white/[0.06] text-[#A1A1AA] border border-white/10'
                        }`}
                      >
                        {alertsEnabled ? 'Alerts On' : 'Alerts Off'}
                      </button>
                    </div>
                    <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                      {alertLog.length === 0 ? (
                        <p className="py-4 text-center text-xs text-[#71717A]">
                          No wicket or boundary alerts recorded yet. Open a match to follow deliveries.
                        </p>
                      ) : (
                        alertLog.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-white/[0.06] bg-[#111114] px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-semibold ${
                                  item.tone === 'wicket'
                                    ? 'text-[#FB7185]'
                                    : item.tone === 'boundary'
                                      ? 'text-[#F59E0B]'
                                      : 'text-[#38BDF8]'
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="font-mono text-[10px] text-[#71717A]">
                                {item.time}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[#A1A1AA] line-clamp-2">
                              {item.subtitle}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clean connection indicator */}
            <div className="hidden sm:flex items-center border-l border-white/[0.08] pl-3 ml-1">
              <span
                className={`font-mono text-[11px] font-semibold tracking-wider whitespace-nowrap ${
                  mode === 'live'
                    ? 'text-[#34D399]'
                    : mode === 'demo'
                      ? 'text-[#F59E0B]'
                      : 'text-[#71717A]'
                }`}
              >
                {mode === 'live' ? 'LIVE FEED' : mode === 'demo' ? 'DEMO MODE' : 'SYNCING'}
              </span>
            </div>

            {/* Mobile drawer toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#131317] text-[#FAFAFA]"
            >
              {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              aria-label="Mobile navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/[0.07] bg-[#111114] md:hidden"
            >
              <div className="flex flex-col px-4 py-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = !isMatchDetailOpen && activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#18181D] text-[#38BDF8]'
                          : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#FAFAFA]'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <div className="pt-2 mt-2 border-t border-white/[0.07] flex items-center justify-between px-3 py-1 text-xs">
                  <span className="text-[#71717A]">Data Feed</span>
                  <span
                    className={`font-mono font-semibold ${
                      mode === 'live'
                        ? 'text-[#34D399]'
                        : mode === 'demo'
                          ? 'text-[#F59E0B]'
                          : 'text-[#71717A]'
                    }`}
                  >
                    {mode === 'live' ? 'LIVE FEED' : mode === 'demo' ? 'DEMO MODE' : 'SYNCING'}
                  </span>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Instant Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-20"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search matches"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bl-card-elevated w-full max-w-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
                <Search className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team, tournament, venue, or format..."
                  aria-label="Search matches by team, tournament, venue, or format"
                  className="w-full bg-transparent text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="rounded-md p-1 text-[#A1A1AA] hover:text-[#FAFAFA]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
                {filteredSearchMatches.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[#71717A]">
                    No matches found for &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  filteredSearchMatches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectMatch(m.id);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex -space-x-1.5 shrink-0">
                          <TeamBadge
                            name={m.teamA.name}
                            shortName={m.teamA.shortName}
                            primaryColor={m.teamA.primaryColor}
                            secondaryColor={m.teamA.secondaryColor}
                            logoUrl={m.teamA.logoUrl}
                            size="sm"
                          />
                          <TeamBadge
                            name={m.teamB.name}
                            shortName={m.teamB.shortName}
                            primaryColor={m.teamB.primaryColor}
                            secondaryColor={m.teamB.secondaryColor}
                            logoUrl={m.teamB.logoUrl}
                            size="sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#FAFAFA]">
                            {m.teamA.name} vs {m.teamB.name}
                          </p>
                          <p className="truncate text-xs text-[#71717A]">
                            {m.tournamentName} · {m.format} · {m.venue.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-[11px] font-semibold uppercase ${
                            m.status === 'live'
                              ? 'text-[#34D399]'
                              : m.status === 'upcoming'
                                ? 'text-[#38BDF8]'
                                : 'text-[#A1A1AA]'
                          }`}
                        >
                          {m.status}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#71717A]" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
