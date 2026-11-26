import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { fetchApiStatus } from './api/client';
import { useMatchesPolling } from './hooks/useLiveMatchPolling';
import type { Delivery } from './types/cricket';
import { AtmosphereCanvas, type AmbientTone } from './components/AtmosphereCanvas';
import { Navigation, type AlertLogItem, type NavSection } from './components/Navigation';
import { MatchDiscovery, type StatusFilter } from './components/MatchDiscovery';
import { MatchCentre } from './components/MatchCentre';
import { PointsTableView } from './components/PointsTableView';
import { AboutView } from './components/AboutView';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('matches');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [ambientTone, setAmbientTone] = useState<AmbientTone>('default');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertLog, setAlertLog] = useState<AlertLogItem[]>([]);
  const [activeToast, setActiveToast] = useState<AlertLogItem | null>(null);

  const { data: apiStatus } = useQuery({
    queryKey: ['api-status'],
    queryFn: fetchApiStatus,
    staleTime: 60_000,
  });

  const {
    data: matchesPayload,
    isLoading,
    isFetching,
    isStale,
    lastUpdated,
    refetch,
  } = useMatchesPolling();

  const matches = matchesPayload?.matches ?? [];
  const dataMode = matchesPayload?.mode ?? apiStatus?.mode ?? 'connecting';

  const handleSelectSection = useCallback((section: NavSection) => {
    setSelectedMatchId(null);
    setActiveSection(section);
    setAmbientTone('default');
    if (section === 'matches') setStatusFilter('all');
    if (section === 'live') setStatusFilter('live');
    if (section === 'upcoming') setStatusFilter('upcoming');
    if (section === 'results') setStatusFilter('completed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenMatch = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackFromMatch = useCallback(() => {
    setSelectedMatchId(null);
    setAmbientTone('default');
  }, []);

  const handleDeliveryAlert = useCallback(
    (delivery: Delivery, matchLabel: string) => {
      const title = delivery.isWicket
        ? `WICKET · ${matchLabel}`
        : delivery.isBoundarySix
          ? `SIX · ${matchLabel}`
          : `FOUR · ${matchLabel}`;
      const item: AlertLogItem = {
        id: delivery.id,
        title,
        subtitle: delivery.commentary,
        tone: delivery.isWicket ? 'wicket' : 'boundary',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setAlertLog((prev) => [item, ...prev.filter((p) => p.id !== item.id)].slice(0, 12));
      if (alertsEnabled) {
        setActiveToast(item);
        window.setTimeout(() => {
          setActiveToast((curr) => (curr?.id === item.id ? null : curr));
        }, 3200);
      }
    },
    [alertsEnabled]
  );

  return (
    <div className="relative min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
      <AtmosphereCanvas tone={ambientTone} />

      <Navigation
        activeSection={activeSection}
        isMatchDetailOpen={Boolean(selectedMatchId)}
        onSelectSection={handleSelectSection}
        onSelectMatch={handleOpenMatch}
        matches={matches}
        mode={dataMode}
        alertsEnabled={alertsEnabled}
        onToggleAlerts={() => setAlertsEnabled((v) => !v)}
        alertLog={alertLog}
      />

      {/* Non-intrusive Match Alert Toast */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-white/10 bg-[#18181D]/96 px-4 py-3 shadow-2xl"
          >
            <p
              className={`font-mono text-xs font-bold tracking-wider ${
                activeToast.tone === 'wicket' ? 'text-[#FB7185]' : 'text-[#F59E0B]'
              }`}
            >
              {activeToast.title}
            </p>
            <p className="mt-1 text-xs text-[#A1A1AA] line-clamp-2">{activeToast.subtitle}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <AnimatePresence mode="wait">
          {selectedMatchId ? (
            <motion.div
              key={`match-${selectedMatchId}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <MatchCentre
                matchId={selectedMatchId}
                onBack={handleBackFromMatch}
                onAmbientToneChange={setAmbientTone}
                onDeliveryAlert={handleDeliveryAlert}
              />
            </motion.div>
          ) : activeSection === 'points' ? (
            <motion.div
              key="view-points"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <PointsTableView />
            </motion.div>
          ) : activeSection === 'about' ? (
            <motion.div
              key="view-about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <AboutView apiStatus={apiStatus} />
            </motion.div>
          ) : (
            <motion.div
              key={`view-discovery-${activeSection}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <MatchDiscovery
                matches={matches}
                mode={dataMode}
                statusFilter={statusFilter}
                onStatusFilterChange={(next) => {
                  setStatusFilter(next);
                  if (next === 'all') setActiveSection('matches');
                  if (next === 'live') setActiveSection('live');
                  if (next === 'upcoming') setActiveSection('upcoming');
                  if (next === 'completed') setActiveSection('results');
                }}
                onOpenMatch={handleOpenMatch}
                isLoading={isLoading}
                isFetching={isFetching}
                isStale={isStale}
                lastUpdated={lastUpdated}
                onRefresh={() => refetch()}
                apiNotice={apiStatus?.notice}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-white/[0.07] bg-[#09090B]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-[#71717A] sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-wider text-[#A1A1AA]">
              BOUNDARYLIVE
            </span>
            <span aria-hidden="true">·</span>
            <span>Live Cricket Match Centre</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleSelectSection('matches')}
              className="hover:text-[#FAFAFA] transition-colors"
            >
              Matches
            </button>
            <button
              type="button"
              onClick={() => handleSelectSection('points')}
              className="hover:text-[#FAFAFA] transition-colors"
            >
              Points Table
            </button>
            <button
              type="button"
              onClick={() => handleSelectSection('about')}
              className="hover:text-[#FAFAFA] transition-colors"
            >
              About
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
