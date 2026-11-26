import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { MatchSummary } from '../types/cricket';
import { TeamBadge } from './TeamBadge';

interface MatchCardProps {
  match: MatchSummary;
  index: number;
  onOpenMatch: (matchId: string) => void;
}

function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, index, onOpenMatch }) => {
  const reduced = useReducedMotion();
  const scoreA = match.teamAScores[match.teamAScores.length - 1];
  const scoreB = match.teamBScores[match.teamBScores.length - 1];
  const winA = match.winningTeamId === match.teamA.id;
  const winB = match.winningTeamId === match.teamB.id;

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.button
      type="button"
      layout={reduced ? false : 'position'}
      initial={reduced ? false : { opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
      whileHover={reduced ? undefined : { y: -5, scale: 1.012 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      transition={{
        layout: { type: 'spring', stiffness: 360, damping: 30 },
        opacity: { duration: 0.24, delay: Math.min(index * 0.04, 0.24) },
        y: { type: 'spring', stiffness: 360, damping: 28, delay: Math.min(index * 0.04, 0.24) },
        scale: { type: 'spring', stiffness: 400, damping: 28 },
      }}
      onMouseMove={handleMouseMove}
      onClick={() => onOpenMatch(match.id)}
      aria-label={`Open match ${match.teamA.name} vs ${match.teamB.name}`}
      className="bl-card bl-card-interactive group flex w-full flex-col justify-between overflow-hidden p-5 text-left cursor-pointer"
    >
      <div className="relative z-10 w-full">
        {/* Quiet 1-line Header */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate font-medium text-[#A1A1AA]">
              {match.tournamentName}
            </span>
            <span aria-hidden="true" className="text-[#52525B]">·</span>
            <span className="shrink-0 font-mono text-[#71717A]">{match.format}</span>
          </div>
          <span
            className={`shrink-0 font-mono text-[11px] font-semibold tracking-wider uppercase ${
              match.status === 'live'
                ? 'text-[#34D399]'
                : match.status === 'upcoming'
                  ? 'text-[#38BDF8]'
                  : 'text-[#71717A]'
            }`}
          >
            {match.status === 'live' ? 'LIVE' : match.status === 'upcoming' ? 'UPCOMING' : 'RESULT'}
          </span>
        </div>

        {/* Teams & Scores */}
        <div className="mt-4 space-y-3">
          {/* Team A */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <TeamBadge
                name={match.teamA.name}
                shortName={match.teamA.shortName}
                primaryColor={match.teamA.primaryColor}
                secondaryColor={match.teamA.secondaryColor}
                logoUrl={match.teamA.logoUrl}
                size="sm"
              />
              <span
                className={`truncate font-display text-sm font-semibold transition-colors ${
                  winA
                    ? 'text-[#FAFAFA]'
                    : match.status === 'completed' && winB
                      ? 'text-[#A1A1AA]'
                      : 'text-[#FAFAFA]'
                }`}
              >
                {match.teamA.name}
              </span>
            </div>
            <div className="shrink-0 text-right font-mono tabular-nums">
              {scoreA ? (
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-base font-bold ${
                      winA ? 'text-[#38BDF8]' : 'text-[#FAFAFA]'
                    }`}
                  >
                    {scoreA.score}
                  </span>
                  <span className="text-xs text-[#71717A]">({scoreA.overs})</span>
                </div>
              ) : (
                <span className="text-xs text-[#52525B]">—</span>
              )}
            </div>
          </div>

          {/* Team B */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <TeamBadge
                name={match.teamB.name}
                shortName={match.teamB.shortName}
                primaryColor={match.teamB.primaryColor}
                secondaryColor={match.teamB.secondaryColor}
                logoUrl={match.teamB.logoUrl}
                size="sm"
              />
              <span
                className={`truncate font-display text-sm font-semibold transition-colors ${
                  winB
                    ? 'text-[#FAFAFA]'
                    : match.status === 'completed' && winA
                      ? 'text-[#A1A1AA]'
                      : 'text-[#FAFAFA]'
                }`}
              >
                {match.teamB.name}
              </span>
            </div>
            <div className="shrink-0 text-right font-mono tabular-nums">
              {scoreB ? (
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-base font-bold ${
                      winB ? 'text-[#38BDF8]' : 'text-[#FAFAFA]'
                    }`}
                  >
                    {scoreB.score}
                  </span>
                  <span className="text-xs text-[#71717A]">({scoreB.overs})</span>
                </div>
              ) : (
                <span className="text-xs text-[#52525B]">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="relative z-10 mt-5 flex w-full items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[#D4D4D8]">{match.statusText}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#71717A]">
            {match.venue.name}
            {match.status !== 'live' ? ` · ${formatMatchDate(match.startTime)}` : ''}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#71717A] transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-[#38BDF8]/12 group-hover:text-[#38BDF8]"
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </motion.button>
  );
};
