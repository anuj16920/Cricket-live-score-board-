import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, MapPin } from 'lucide-react';
import type { BallEventType, MatchSummary } from '../types/cricket';
import { TeamBadge } from './TeamBadge';
import { AnimatedNumber } from './AnimatedNumber';

interface FeaturedMatchCardProps {
  match: MatchSummary;
  onOpenMatch: (matchId: string) => void;
}

function chipTone(type: BallEventType): string {
  switch (type) {
    case 'FOUR':
      return 'border-[#F59E0B]/45 bg-[#F59E0B]/15 text-[#F59E0B]';
    case 'SIX':
      return 'border-[#34D399]/50 bg-[#34D399]/18 text-[#34D399]';
    case 'WICKET':
      return 'border-[#FB7185]/50 bg-[#FB7185]/18 text-[#FB7185]';
    case 'DOT':
      return 'border-white/10 bg-white/[0.04] text-[#A1A1AA]';
    default:
      return 'border-[#38BDF8]/30 bg-[#38BDF8]/12 text-[#FAFAFA]';
  }
}

export const FeaturedMatchCard: React.FC<FeaturedMatchCardProps> = ({
  match,
  onOpenMatch,
}) => {
  const reduced = useReducedMotion();
  const scoreA = match.teamAScores[match.teamAScores.length - 1];
  const scoreB = match.teamBScores[match.teamBScores.length - 1];

  const highlightA =
    match.status === 'completed'
      ? match.winningTeamId === match.teamA.id
      : match.teamBScores.length === 0 && match.teamAScores.length > 0;
  const highlightB =
    match.status === 'completed'
      ? match.winningTeamId === match.teamB.id
      : match.teamBScores.length > 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.section
      aria-label="Featured match"
      initial={reduced ? false : { opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={reduced ? undefined : { y: -3 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      onMouseMove={handleMouseMove}
      onClick={() => onOpenMatch(match.id)}
      className="bl-card-elevated bl-card-interactive group cursor-pointer overflow-hidden p-6 sm:p-7"
    >
      {/* Subtle overhead accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-64 w-64"
        style={{
          background:
            match.status === 'live'
              ? 'radial-gradient(circle at center, rgba(52, 211, 153, 0.14) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10">
        {/* Clean Metadata Line */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {match.status === 'live' ? (
              <span className="font-mono font-bold tracking-wider text-[#34D399]">
                LIVE
              </span>
            ) : match.status === 'completed' ? (
              <span className="font-mono font-bold tracking-wider text-[#38BDF8]">
                LATEST RESULT
              </span>
            ) : (
              <span className="font-mono font-bold tracking-wider text-[#A1A1AA]">
                UPCOMING
              </span>
            )}
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="font-medium text-[#FAFAFA]">{match.tournamentName}</span>
            <span aria-hidden="true" className="hidden sm:inline text-[#52525B]">·</span>
            <span className="text-[#A1A1AA]">{match.matchNumber}</span>
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="font-mono text-[#71717A]">{match.format}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {match.venue.name}
              {match.venue.city ? `, ${match.venue.city}` : ''}
            </span>
          </div>
        </div>

        {/* Scores + Primary Action */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Team A */}
            <div className="flex items-center gap-4">
              <TeamBadge
                name={match.teamA.name}
                shortName={match.teamA.shortName}
                primaryColor={match.teamA.primaryColor}
                secondaryColor={match.teamA.secondaryColor}
                logoUrl={match.teamA.logoUrl}
                size="xl"
              />
              <div className="min-w-0">
                <p
                  className={`font-display text-base font-semibold truncate ${
                    highlightA ? 'text-[#FAFAFA]' : 'text-[#A1A1AA]'
                  }`}
                >
                  {match.teamA.name}
                </p>
                {scoreA ? (
                  <div className="mt-1 flex items-baseline gap-2.5">
                    <AnimatedNumber
                      value={scoreA.score}
                      className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                        highlightA ? 'text-[#38BDF8]' : 'text-[#FAFAFA]'
                      }`}
                    />
                    <span className="font-mono text-xs sm:text-sm text-[#71717A] tabular-nums">
                      ({scoreA.overs})
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-sm text-[#71717A]">Yet to bat</p>
                )}
              </div>
            </div>

            {/* Team B */}
            <div className="flex items-center gap-4">
              <TeamBadge
                name={match.teamB.name}
                shortName={match.teamB.shortName}
                primaryColor={match.teamB.primaryColor}
                secondaryColor={match.teamB.secondaryColor}
                logoUrl={match.teamB.logoUrl}
                size="xl"
              />
              <div className="min-w-0">
                <p
                  className={`font-display text-base font-semibold truncate ${
                    highlightB ? 'text-[#FAFAFA]' : 'text-[#A1A1AA]'
                  }`}
                >
                  {match.teamB.name}
                </p>
                {scoreB ? (
                  <div className="mt-1 flex items-baseline gap-2.5">
                    <AnimatedNumber
                      value={scoreB.score}
                      className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                        highlightB ? 'text-[#38BDF8]' : 'text-[#FAFAFA]'
                      }`}
                    />
                    <span className="font-mono text-xs sm:text-sm text-[#71717A] tabular-nums">
                      ({scoreB.overs})
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-sm text-[#71717A]">Yet to bat</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Column */}
          <div className="lg:col-span-4 flex flex-col gap-3.5 lg:items-end lg:border-l lg:border-white/[0.07] lg:pl-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
              {match.currentRunRate !== undefined && (
                <div>
                  <span className="text-[#71717A]">CRR </span>
                  <span className="font-mono font-semibold text-[#FAFAFA] tabular-nums">
                    {match.currentRunRate.toFixed(2)}
                  </span>
                </div>
              )}
              {match.requiredRunRate !== undefined && match.status === 'live' && (
                <div>
                  <span className="text-[#71717A]">RRR </span>
                  <span className="font-mono font-semibold text-[#F59E0B] tabular-nums">
                    {match.requiredRunRate.toFixed(2)}
                  </span>
                </div>
              )}
              {match.target !== undefined && (
                <div>
                  <span className="text-[#71717A]">Target </span>
                  <span className="font-mono font-semibold text-[#FAFAFA] tabular-nums">
                    {match.target}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMatch(match.id);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FAFAFA] px-5 py-2.5 text-sm font-semibold text-[#09090B] transition-all duration-200 hover:bg-white active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              <span>Open Match Centre</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Footer Result / Recent Deliveries */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
          <p className="text-sm font-medium text-[#FAFAFA]">{match.statusText}</p>

          {match.recentBalls.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-[#71717A] whitespace-nowrap">Recent:</span>
              <div className="flex items-center gap-1.5">
                {match.recentBalls.map((b) => (
                  <span
                    key={b.id}
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg border px-1.5 font-mono text-xs font-semibold tabular-nums ${chipTone(
                      b.eventType
                    )}`}
                  >
                    {b.chipLabel}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};
