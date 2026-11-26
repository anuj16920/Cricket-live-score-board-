import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import type { BallEventType, Delivery } from '../types/cricket';
import { resetDemoMatch, simulateDemoDelivery } from '../api/client';
import { useLiveMatchDetail } from '../hooks/useLiveMatchPolling';
import type { AmbientTone } from './AtmosphereCanvas';
import { DataStatus } from './DataStatus';
import { Scoreboard } from './Scoreboard';
import { BatterCard } from './BatterCard';
import { BowlerCard } from './BowlerCard';
import { CurrentOver } from './CurrentOver';
import { CommentaryFeed } from './CommentaryFeed';
import { RunRateChart } from './RunRateChart';
import { Scorecard } from './Scorecard';
import { SquadPanel } from './SquadPanel';
import { MatchInformation } from './MatchInformation';
import { DemoSimBar } from './DemoSimBar';

type MatchCentreTab = 'live' | 'scorecard' | 'squads' | 'info';

interface MatchCentreProps {
  matchId: string;
  onBack: () => void;
  onAmbientToneChange: (tone: AmbientTone) => void;
  onDeliveryAlert: (delivery: Delivery, matchLabel: string) => void;
}

const TABS: { id: MatchCentreTab; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'squads', label: 'Squads' },
  { id: 'info', label: 'Match Info' },
];

export const MatchCentre: React.FC<MatchCentreProps> = ({
  matchId,
  onBack,
  onAmbientToneChange,
  onDeliveryAlert,
}) => {
  const [activeTab, setActiveTab] = useState<MatchCentreTab>('live');
  const [activeEvent, setActiveEvent] = useState<Delivery | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [simBusy, setSimBusy] = useState(false);
  const eventTimerRef = useRef<number | null>(null);

  const triggerEventAnimation = useCallback(
    (delivery: Delivery, label?: string) => {
      setActiveEvent(delivery);

      const durationMs =
        delivery.eventType === 'SIX' || delivery.eventType === 'WICKET'
          ? 2400
          : delivery.eventType === 'FOUR'
            ? 1900
            : 1300;

      if (delivery.eventType === 'FOUR' || delivery.eventType === 'SIX') {
        onAmbientToneChange('boundary');
      } else if (delivery.eventType === 'WICKET') {
        onAmbientToneChange('wicket');
      } else {
        onAmbientToneChange('live');
      }

      if (delivery.isBoundaryFour || delivery.isBoundarySix || delivery.isWicket) {
        onDeliveryAlert(delivery, label ?? 'Live Match');
      }

      if (eventTimerRef.current) {
        window.clearTimeout(eventTimerRef.current);
      }
      eventTimerRef.current = window.setTimeout(() => {
        setActiveEvent(null);
        onAmbientToneChange('live');
      }, durationMs);
    },
    [onAmbientToneChange, onDeliveryAlert]
  );

  useEffect(() => {
    return () => {
      if (eventTimerRef.current) window.clearTimeout(eventTimerRef.current);
      onAmbientToneChange('default');
    };
  }, [onAmbientToneChange]);

  const {
    data: match,
    isLoading,
    isError,
    isFetching,
    lastUpdated,
    isStale,
    refetch,
    applyPushedMatchState,
  } = useLiveMatchDetail(matchId, (freshDelivery) => {
    triggerEventAnimation(freshDelivery);
  });

  const hasInitializedTabRef = useRef<string | null>(null);

  useEffect(() => {
    if (!match) return;
    if (match.status === 'live') {
      onAmbientToneChange('live');
    } else {
      onAmbientToneChange('default');
    }
    if (hasInitializedTabRef.current !== match.id) {
      hasInitializedTabRef.current = match.id;
      if (match.status === 'completed' && match.innings.length > 0) {
        setActiveTab('scorecard');
      } else if (match.status === 'upcoming') {
        setActiveTab('info');
      } else {
        setActiveTab('live');
      }
    }
  }, [match, onAmbientToneChange]);

  const handleSimulate = useCallback(
    async (eventType?: BallEventType) => {
      if (!match || match.dataMode !== 'demo' || match.status !== 'live' || simBusy) return;
      setSimBusy(true);
      try {
        const res = await simulateDemoDelivery(match.id, eventType);
        applyPushedMatchState(res.match, res.delivery);
        triggerEventAnimation(
          res.delivery,
          `${res.match.teamA.shortName} vs ${res.match.teamB.shortName}`
        );
      } catch {
        setAutoPlay(false);
      } finally {
        setSimBusy(false);
      }
    },
    [match, simBusy, applyPushedMatchState, triggerEventAnimation]
  );

  const handleReset = useCallback(async () => {
    if (!match || match.dataMode !== 'demo' || simBusy) return;
    setAutoPlay(false);
    setSimBusy(true);
    try {
      const resetMatch = await resetDemoMatch(match.id);
      applyPushedMatchState(resetMatch);
      setActiveEvent(null);
    } finally {
      setSimBusy(false);
    }
  }, [match, simBusy, applyPushedMatchState]);

  useEffect(() => {
    if (!autoPlay || !match || match.status !== 'live' || match.dataMode !== 'demo') {
      return;
    }
    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void handleSimulate();
      }
    }, 4500);
    return () => window.clearInterval(interval);
  }, [autoPlay, match, handleSimulate]);

  if (isLoading && !match) {
    return (
      <div className="space-y-5">
        <div className="h-9 w-36 animate-pulse rounded-xl bg-[#131317]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#131317]" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-44 animate-pulse rounded-2xl bg-[#131317]" />
          <div className="h-44 animate-pulse rounded-2xl bg-[#131317]" />
        </div>
      </div>
    );
  }

  if (isError && !match) {
    return (
      <div className="bl-card p-8 text-center">
        <p className="font-display text-lg font-semibold text-[#FAFAFA]">
          Unable to load match data
        </p>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          The cricket feed could not be reached. Please try refreshing or returning to Matches.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-white/10 bg-[#131317] px-4 py-2 text-sm font-medium text-[#FAFAFA]"
          >
            Back to Matches
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-[#FAFAFA] px-4 py-2 text-sm font-semibold text-[#09090B]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!match) return null;

  const activeInnings =
    match.innings.find((i) => i.inningsNumber === match.currentInningsNumber) ??
    match.innings[match.innings.length - 1];
  const activePartnership = activeInnings?.partnerships.find((p) => p.isCurrent);
  const currentOverNumber = activeInnings ? Math.floor(activeInnings.legalBalls / 6) : undefined;
  const formattedDate = new Date(match.startTime).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Top Bar: Back + Inline Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#131317] px-3 py-1.5 text-xs sm:text-sm font-medium text-[#A1A1AA] transition-colors hover:border-white/20 hover:text-[#FAFAFA]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>All Matches</span>
        </button>

        <DataStatus
          mode={match.dataMode}
          lastUpdated={lastUpdated}
          isStale={isStale}
          isFetching={isFetching}
          onRefresh={() => refetch()}
        />
      </div>

      {/* Match Title & Meta (unboxed, clean editorial header) */}
      <section aria-label="Match header" className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span
              className={`font-mono font-bold uppercase tracking-wider ${
                match.status === 'live'
                  ? 'text-[#34D399]'
                  : match.status === 'upcoming'
                    ? 'text-[#38BDF8]'
                    : 'text-[#A1A1AA]'
              }`}
            >
              {match.status === 'live'
                ? 'LIVE'
                : match.status === 'upcoming'
                  ? 'UPCOMING'
                  : 'COMPLETED'}
            </span>
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="font-medium text-[#FAFAFA]">{match.tournamentName}</span>
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="text-[#A1A1AA]">{match.matchNumber}</span>
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="font-mono text-[#71717A]">{match.format}</span>
          </div>
          <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            {match.teamA.name} vs {match.teamB.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#71717A]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {match.venue.name}
            {match.venue.city ? `, ${match.venue.city}` : ''}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
        </div>
      </section>

      {/* Main Scoreboard Card */}
      <Scoreboard match={match} activeDeliveryEvent={activeEvent} />

      {/* Demo Simulator Studio (Demo Mode only) */}
      {match.dataMode === 'demo' && match.innings.length > 0 && (
        <DemoSimBar
          isLiveMatch={match.status === 'live'}
          autoPlay={autoPlay}
          isBusy={simBusy}
          onToggleAutoPlay={() => setAutoPlay((p) => !p)}
          onSimulate={handleSimulate}
          onReset={handleReset}
        />
      )}

      {/* Match Centre Tabs */}
      <div
        role="tablist"
        aria-label="Match centre sections"
        className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.08]"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive ? 'text-[#FAFAFA]' : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="match-centre-tab-underline"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[#38BDF8]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'live' && (
        <motion.div
          key="tab-live"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-5 lg:grid-cols-12"
        >
          <div className="space-y-5 lg:col-span-7">
            <BatterCard
              batters={match.currentBatters}
              activePartnership={activePartnership}
            />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <BowlerCard bowler={match.currentBowler} />
              <CurrentOver
                balls={match.currentOverBalls}
                overNumber={currentOverNumber}
              />
            </div>
            <RunRateChart match={match} />
          </div>

          <div className="lg:col-span-5">
            <CommentaryFeed
              deliveries={match.deliveries}
              onReplayDelivery={(delivery) =>
                triggerEventAnimation(
                  { ...delivery, id: `${delivery.id}-replay-${Date.now()}` },
                  `${match.teamA.shortName} vs ${match.teamB.shortName}`
                )
              }
            />
          </div>
        </motion.div>
      )}

      {activeTab === 'scorecard' && (
        <motion.div
          key="tab-scorecard"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <Scorecard match={match} />
        </motion.div>
      )}

      {activeTab === 'squads' && (
        <motion.div
          key="tab-squads"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <SquadPanel teamA={match.teamA} teamB={match.teamB} />
        </motion.div>
      )}

      {activeTab === 'info' && (
        <motion.div
          key="tab-info"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <MatchInformation match={match} />
        </motion.div>
      )}
    </div>
  );
};
