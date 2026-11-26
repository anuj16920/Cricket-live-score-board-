import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllStandings } from '../api/client';
import { TeamBadge } from './TeamBadge';

export const PointsTableView: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['standings'],
    queryFn: fetchAllStandings,
    staleTime: 60_000,
  });

  const standingsList = data?.standings ?? [];
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');

  const activeStanding =
    standingsList.find((s) => s.tournamentId === selectedTournamentId) ??
    standingsList[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-[#131317]" />
        <div className="h-80 animate-pulse rounded-2xl bg-[#131317]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bl-card p-8 text-center">
        <p className="font-display text-base font-semibold text-[#FAFAFA]">
          Standings temporarily unavailable
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-[#09090B]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!activeStanding) {
    return (
      <div className="bl-card p-8 text-center">
        <p className="font-display text-base font-semibold text-[#FAFAFA]">
          No standings tables available
        </p>
        <p className="mt-1 text-sm text-[#71717A]">
          Tournament standings will appear when league seasons are active.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            Points Table
          </h1>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            League standings, net run rate, and recent five-match form.
          </p>
        </div>

        {/* Tournament selector */}
        <div className="flex flex-wrap items-center gap-2">
          {standingsList.map((t) => {
            const active = t.tournamentId === activeStanding.tournamentId;
            return (
              <button
                key={t.tournamentId}
                type="button"
                onClick={() => setSelectedTournamentId(t.tournamentId)}
                className={`rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[#38BDF8]/45 bg-[#18181D] text-[#FAFAFA]'
                    : 'border-white/[0.08] bg-[#111114] text-[#A1A1AA] hover:border-white/20 hover:text-[#FAFAFA]'
                }`}
              >
                {t.tournamentName}{' '}
                <span className="ml-1 font-mono text-[11px] text-[#38BDF8]">{t.format}</span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.section
        key={activeStanding.tournamentId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        aria-label={`${activeStanding.tournamentName} standings`}
        className="bl-card overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
              {activeStanding.tournamentName}
            </h2>
            <p className="text-xs text-[#71717A]">
              {activeStanding.season} · Top {activeStanding.qualifyCutoff} qualify for playoffs
              {activeStanding.dataMode === 'demo' ? ' · DEMO MODE' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#111114] text-[11px] uppercase tracking-wider text-[#71717A]">
                <th className="py-3 pl-5 pr-2 font-medium w-12">#</th>
                <th className="py-3 px-3 font-medium">Team</th>
                <th className="py-3 px-3 text-right font-medium">P</th>
                <th className="py-3 px-3 text-right font-medium">W</th>
                <th className="py-3 px-3 text-right font-medium">L</th>
                <th className="py-3 px-3 text-right font-medium">NR</th>
                <th className="py-3 px-3 text-right font-medium">Pts</th>
                <th className="py-3 px-3 text-right font-medium">NRR</th>
                <th className="py-3 pl-3 pr-5 text-right font-medium">Recent Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {activeStanding.rows.map((row) => {
                const isCutoffLine = row.position === activeStanding.qualifyCutoff;
                return (
                  <tr
                    key={row.teamId}
                    className={`transition-colors hover:bg-white/[0.025] ${
                      isCutoffLine ? 'border-b-2 border-b-[#38BDF8]/30' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-5 pr-2 font-mono font-semibold text-[#A1A1AA] tabular-nums">
                      <span
                        className={
                          row.position <= activeStanding.qualifyCutoff
                            ? 'text-[#38BDF8]'
                            : 'text-[#71717A]'
                        }
                      >
                        {row.position}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <TeamBadge
                          name={row.teamName}
                          shortName={row.teamShortName}
                          primaryColor={row.primaryColor}
                          secondaryColor={row.secondaryColor}
                          logoUrl={row.logoUrl}
                          size="sm"
                        />
                        <span className="font-display font-semibold text-[#FAFAFA] whitespace-nowrap">
                          {row.teamName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                      {row.played}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#FAFAFA] tabular-nums">
                      {row.won}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                      {row.lost}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#71717A] tabular-nums">
                      {row.noResult}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-[#FAFAFA] tabular-nums">
                      {row.points}
                    </td>
                    <td
                      className={`py-3.5 px-3 text-right font-mono font-medium tabular-nums ${
                        row.netRunRate >= 0 ? 'text-[#34D399]' : 'text-[#FB7185]'
                      }`}
                    >
                      {row.netRunRate >= 0 ? '+' : ''}
                      {row.netRunRate.toFixed(3)}
                    </td>
                    <td className="py-3.5 pl-3 pr-5">
                      <div className="flex items-center justify-end gap-1">
                        {row.recentForm.map((f, idx) => (
                          <span
                            key={`${row.teamId}-f-${idx}`}
                            title={f === 'W' ? 'Won' : f === 'L' ? 'Lost' : 'No Result'}
                            className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-[10px] font-bold ${
                              f === 'W'
                                ? 'bg-[#34D399]/18 text-[#34D399]'
                                : f === 'L'
                                  ? 'bg-[#FB7185]/18 text-[#FB7185]'
                                  : 'bg-white/[0.06] text-[#A1A1AA]'
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
};
