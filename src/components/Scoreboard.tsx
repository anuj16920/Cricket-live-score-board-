import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Delivery, MatchDetail } from '../types/cricket';
import { TeamBadge } from './TeamBadge';
import { AnimatedNumber } from './AnimatedNumber';
import { BallEventOverlay } from './BallEventOverlay';

interface ScoreboardProps {
  match: MatchDetail;
  activeDeliveryEvent: Delivery | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ match, activeDeliveryEvent }) => {
  const reduced = useReducedMotion();
  const activeInnings =
    match.innings.find((i) => i.inningsNumber === match.currentInningsNumber) ??
    match.innings[match.innings.length - 1];

  const isTeamABatting = activeInnings?.battingTeamId === match.teamA.id;
  const isTeamBBatting = activeInnings?.battingTeamId === match.teamB.id;

  const scoreA = match.teamAScores[match.teamAScores.length - 1];
  const scoreB = match.teamBScores[match.teamBScores.length - 1];

  const highlightA =
    match.status === 'completed'
      ? match.winningTeamId === match.teamA.id
      : isTeamABatting && match.status === 'live';
  const highlightB =
    match.status === 'completed'
      ? match.winningTeamId === match.teamB.id
      : isTeamBBatting && match.status === 'live';

  const highlightTone: 'default' | 'boundary' | 'wicket' =
    activeDeliveryEvent?.eventType === 'FOUR' || activeDeliveryEvent?.eventType === 'SIX'
      ? 'boundary'
      : activeDeliveryEvent?.eventType === 'WICKET'
        ? 'wicket'
        : 'default';

  const oversProgressPct =
    activeInnings && activeInnings.maxOvers
      ? Math.min(100, (activeInnings.legalBalls / (activeInnings.maxOvers * 6)) * 100)
      : null;

  const targetProgressPct =
    activeInnings && activeInnings.target
      ? Math.min(100, (activeInnings.runs / activeInnings.target) * 100)
      : null;

  return (
    <motion.section
      aria-label="Main match scoreboard"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bl-card-elevated relative overflow-hidden p-5 sm:p-7"
    >
      {/* Subtle reactive glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[520px] -translate-x-1/2 transition-opacity duration-500"
        style={{
          background:
            highlightTone === 'boundary'
              ? 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.16) 0%, transparent 68%)'
              : highlightTone === 'wicket'
                ? 'radial-gradient(ellipse at center, rgba(251, 113, 133, 0.16) 0%, transparent 68%)'
                : 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.10) 0%, transparent 68%)',
        }}
      />

      {/* Dedicated Ball-by-Ball Animation Layer */}
      <BallEventOverlay delivery={activeDeliveryEvent} />

      <div className="relative z-10">
        {/* Two-Team Score Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {/* Team A */}
          <div
            className={`flex items-start gap-4 rounded-xl p-3.5 transition-colors ${
              isTeamABatting && match.status === 'live'
                ? 'bg-white/[0.03] border border-[#38BDF8]/25'
                : 'border border-transparent'
            }`}
          >
            <TeamBadge
              name={match.teamA.name}
              shortName={match.teamA.shortName}
              primaryColor={match.teamA.primaryColor}
              secondaryColor={match.teamA.secondaryColor}
              logoUrl={match.teamA.logoUrl}
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-display text-lg font-bold text-[#FAFAFA]">
                  {match.teamA.name}
                </h2>
                {isTeamABatting && match.status === 'live' && (
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-[#34D399]">
                    BATTING
                  </span>
                )}
              </div>
              {scoreA ? (
                <div className="mt-1.5">
                  <div className="flex items-baseline gap-3">
                    <AnimatedNumber
                      value={scoreA.score}
                      highlightTone={isTeamABatting ? highlightTone : 'default'}
                      className={`text-4xl sm:text-5xl font-bold tracking-tight ${
                        highlightA ? 'text-[#38BDF8]' : 'text-[#FAFAFA]'
                      }`}
                    />
                    <span className="font-mono text-sm text-[#A1A1AA] tabular-nums">
                      {scoreA.overs} ov
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#71717A]">{scoreA.label}</p>
                </div>
              ) : (
                <p className="mt-2 font-mono text-sm text-[#71717A]">
                  {match.status === 'upcoming' ? 'Scheduled' : 'Yet to bat'}
                </p>
              )}
            </div>
          </div>

          {/* Team B */}
          <div
            className={`flex items-start gap-4 rounded-xl p-3.5 transition-colors ${
              isTeamBBatting && match.status === 'live'
                ? 'bg-white/[0.03] border border-[#38BDF8]/25'
                : 'border border-transparent'
            }`}
          >
            <TeamBadge
              name={match.teamB.name}
              shortName={match.teamB.shortName}
              primaryColor={match.teamB.primaryColor}
              secondaryColor={match.teamB.secondaryColor}
              logoUrl={match.teamB.logoUrl}
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-display text-lg font-bold text-[#FAFAFA]">
                  {match.teamB.name}
                </h2>
                {isTeamBBatting && match.status === 'live' && (
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-[#34D399]">
                    BATTING
                  </span>
                )}
              </div>
              {scoreB ? (
                <div className="mt-1.5">
                  <div className="flex items-baseline gap-3">
                    <AnimatedNumber
                      value={scoreB.score}
                      highlightTone={isTeamBBatting ? highlightTone : 'default'}
                      className={`text-4xl sm:text-5xl font-bold tracking-tight ${
                        highlightB ? 'text-[#38BDF8]' : 'text-[#FAFAFA]'
                      }`}
                    />
                    <span className="font-mono text-sm text-[#A1A1AA] tabular-nums">
                      {scoreB.overs} ov
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#71717A]">{scoreB.label}</p>
                </div>
              ) : (
                <p className="mt-2 font-mono text-sm text-[#71717A]">
                  {match.status === 'upcoming' ? 'Scheduled' : 'Yet to bat'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Banner + Rates */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-4">
          <p className="font-display text-base font-semibold text-[#FAFAFA]">
            {match.statusText}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            {match.currentRunRate !== undefined && (
              <div>
                <span className="text-[#71717A]">CRR </span>
                <span className="font-mono text-sm font-semibold text-[#FAFAFA] tabular-nums">
                  {match.currentRunRate.toFixed(2)}
                </span>
              </div>
            )}
            {match.target !== undefined && (
              <div>
                <span className="text-[#71717A]">Target </span>
                <span className="font-mono text-sm font-semibold text-[#FAFAFA] tabular-nums">
                  {match.target}
                </span>
              </div>
            )}
            {match.requiredRuns !== undefined && match.status === 'live' && (
              <div>
                <span className="text-[#71717A]">Need </span>
                <span className="font-mono text-sm font-semibold text-[#38BDF8] tabular-nums">
                  {match.requiredRuns} off {match.remainingBalls ?? 0}b
                </span>
              </div>
            )}
            {match.requiredRunRate !== undefined && match.status === 'live' && (
              <div>
                <span className="text-[#71717A]">RRR </span>
                <span className="font-mono text-sm font-semibold text-[#F59E0B] tabular-nums">
                  {match.requiredRunRate.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bars */}
        {(oversProgressPct !== null || targetProgressPct !== null) && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-white/[0.06] pt-4">
            {oversProgressPct !== null && activeInnings && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#A1A1AA]">Innings Overs</span>
                  <span className="font-mono tabular-nums text-[#FAFAFA]">
                    {activeInnings.oversDisplay} / {activeInnings.maxOvers}.0 ov
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-[#38BDF8] transition-all duration-500"
                    style={{ width: `${oversProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            {targetProgressPct !== null && activeInnings?.target && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#A1A1AA]">Target Chase</span>
                  <span className="font-mono tabular-nums text-[#FAFAFA]">
                    {activeInnings.runs} / {activeInnings.target} runs ({Math.round(targetProgressPct)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#34D399] transition-all duration-500"
                    style={{ width: `${targetProgressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
};
