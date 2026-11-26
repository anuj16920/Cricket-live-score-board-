import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { MatchDetail } from '../types/cricket';

interface ScorecardProps {
  match: MatchDetail;
}

export const Scorecard: React.FC<ScorecardProps> = ({ match }) => {
  const [selectedInnings, setSelectedInnings] = useState<number>(
    match.innings[match.innings.length - 1]?.inningsNumber ?? 1
  );

  useEffect(() => {
    const exists = match.innings.some((i) => i.inningsNumber === selectedInnings);
    if (!exists && match.innings.length > 0) {
      setSelectedInnings(match.innings[match.innings.length - 1].inningsNumber);
    }
  }, [match.innings, selectedInnings]);

  if (match.innings.length === 0) {
    return (
      <section aria-label="Full scorecard" className="bl-card p-8 text-center">
        <p className="font-display text-base font-semibold text-[#FAFAFA]">
          Scorecard Not Yet Available
        </p>
        <p className="mt-1 text-sm text-[#71717A]">
          Batting and bowling tables will populate once the first innings begins.
        </p>
      </section>
    );
  }

  const innings =
    match.innings.find((i) => i.inningsNumber === selectedInnings) ?? match.innings[0];

  const getTeamShort = (teamId: string) =>
    teamId === match.teamA.id ? match.teamA.shortName : match.teamB.shortName;
  const getTeamName = (teamId: string) =>
    teamId === match.teamA.id ? match.teamA.name : match.teamB.name;

  return (
    <div className="space-y-5">
      {/* Innings Switcher */}
      <div
        role="tablist"
        aria-label="Select innings"
        className="flex flex-wrap items-center gap-2"
      >
        {match.innings.map((inn) => {
          const active = inn.inningsNumber === innings.inningsNumber;
          return (
            <button
              key={inn.inningsNumber}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setSelectedInnings(inn.inningsNumber)}
              className={`rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'border-[#38BDF8]/45 bg-[#18181D] text-[#FAFAFA]'
                  : 'border-white/[0.08] bg-[#111114] text-[#A1A1AA] hover:border-white/20 hover:text-[#FAFAFA]'
              }`}
            >
              <span className="font-display font-semibold">
                {getTeamShort(inn.battingTeamId)}
              </span>{' '}
              <span className="text-[#52525B]">·</span> {inn.label}{' '}
              <span className="ml-1 font-mono text-xs text-[#38BDF8] tabular-nums">
                {inn.runs}/{inn.wickets}
              </span>
            </button>
          );
        })}
      </div>

      {/* Batting Scorecard Card */}
      <motion.section
        key={`bat-${innings.inningsNumber}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Batting scorecard"
        className="bl-card overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#FAFAFA]">
              {getTeamName(innings.battingTeamId)} — Batting
            </h3>
            <p className="text-xs text-[#71717A]">
              {innings.label} · Run Rate {innings.runRate.toFixed(2)}
            </p>
          </div>
          <div className="font-mono text-lg font-bold text-[#FAFAFA] tabular-nums">
            {innings.runs}/{innings.wickets}{' '}
            <span className="text-xs font-normal text-[#A1A1AA]">
              ({innings.oversDisplay} ov)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#111114] text-[11px] uppercase tracking-wider text-[#71717A]">
                <th className="py-3 pl-5 pr-3 font-medium">Batter</th>
                <th className="py-3 px-3 font-medium">Dismissal</th>
                <th className="py-3 px-3 text-right font-medium">R</th>
                <th className="py-3 px-3 text-right font-medium">B</th>
                <th className="py-3 px-3 text-right font-medium">4s</th>
                <th className="py-3 px-3 text-right font-medium">6s</th>
                <th className="py-3 pl-3 pr-5 text-right font-medium">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {innings.battingCard.map((b) => (
                <tr
                  key={b.playerId}
                  className={`transition-colors hover:bg-white/[0.025] ${
                    b.isAtCrease && !b.isOut ? 'bg-[#38BDF8]/[0.04]' : ''
                  }`}
                >
                  <td className="py-3 pl-5 pr-3 font-medium text-[#FAFAFA] whitespace-nowrap">
                    {b.name}
                    {b.isOnStrike && (
                      <span className="ml-1 font-mono text-[#38BDF8]">*</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs text-[#A1A1AA]">
                    {b.isOut ? b.dismissal : <span className="text-[#34D399]">not out</span>}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#FAFAFA] tabular-nums">
                    {b.runs}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {b.balls}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {b.fours}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {b.sixes}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right font-mono text-[#38BDF8] tabular-nums">
                    {b.strikeRate.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extras, Total & Did Not Bat */}
        <div className="divide-y divide-white/[0.06] border-t border-white/[0.07] bg-[#111114]/70 px-5 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span className="font-medium text-[#A1A1AA]">Extras</span>
            <span className="font-mono text-[#FAFAFA] tabular-nums">
              <strong>{innings.extras.total}</strong>{' '}
              <span className="text-xs text-[#71717A]">
                (b {innings.extras.byes}, lb {innings.extras.legByes}, w {innings.extras.wides}, nb{' '}
                {innings.extras.noBalls})
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span className="font-display font-semibold text-[#FAFAFA]">Total</span>
            <span className="font-mono font-bold text-[#FAFAFA] tabular-nums">
              {innings.runs}/{innings.wickets}{' '}
              <span className="text-xs font-normal text-[#A1A1AA]">
                ({innings.oversDisplay} overs · RR {innings.runRate.toFixed(2)})
              </span>
            </span>
          </div>

          {innings.didNotBat.length > 0 && (
            <div className="py-3">
              <span className="text-xs font-medium text-[#71717A]">Did not bat: </span>
              <span className="text-xs text-[#A1A1AA]">
                {innings.didNotBat.join(', ')}
              </span>
            </div>
          )}
        </div>
      </motion.section>

      {/* Bowling Scorecard Card */}
      <section aria-label="Bowling scorecard" className="bl-card overflow-hidden">
        <div className="border-b border-white/[0.07] px-5 py-4">
          <h3 className="font-display text-base font-semibold text-[#FAFAFA]">
            {getTeamName(innings.bowlingTeamId)} — Bowling
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#111114] text-[11px] uppercase tracking-wider text-[#71717A]">
                <th className="py-3 pl-5 pr-3 font-medium">Bowler</th>
                <th className="py-3 px-3 text-right font-medium">O</th>
                <th className="py-3 px-3 text-right font-medium">M</th>
                <th className="py-3 px-3 text-right font-medium">R</th>
                <th className="py-3 px-3 text-right font-medium">W</th>
                <th className="py-3 px-3 text-right font-medium">Econ</th>
                <th className="py-3 px-3 text-right font-medium">WD</th>
                <th className="py-3 pl-3 pr-5 text-right font-medium">NB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {innings.bowlingCard.map((bw) => (
                <tr
                  key={bw.playerId}
                  className={`transition-colors hover:bg-white/[0.025] ${
                    bw.isCurrentBowler ? 'bg-[#38BDF8]/[0.04]' : ''
                  }`}
                >
                  <td className="py-3 pl-5 pr-3 font-medium text-[#FAFAFA] whitespace-nowrap">
                    {bw.name}
                    {bw.isCurrentBowler && (
                      <span className="ml-1.5 font-mono text-[10px] text-[#34D399]">
                        BOWLING
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {bw.overs.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {bw.maidens}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#FAFAFA] tabular-nums">
                    {bw.runs}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#38BDF8] tabular-nums">
                    {bw.wickets}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {bw.economy.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#71717A] tabular-nums">
                    {bw.wides}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right font-mono text-[#71717A] tabular-nums">
                    {bw.noBalls}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fall of Wickets & Partnerships Grid */}
      {(innings.fallOfWickets.length > 0 || innings.partnerships.length > 0) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {innings.fallOfWickets.length > 0 && (
            <section aria-label="Fall of wickets" className="bl-card p-5">
              <h3 className="font-display text-sm font-semibold text-[#FAFAFA] border-b border-white/[0.07] pb-3">
                Fall of Wickets
              </h3>
              <div className="mt-3 divide-y divide-white/[0.06]">
                {innings.fallOfWickets.map((fow) => (
                  <div
                    key={`${fow.wicketNumber}-${fow.batterName}`}
                    className="flex items-center justify-between gap-3 py-2.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-semibold text-[#FB7185] tabular-nums">
                        {fow.score}/{fow.wicketNumber}
                      </span>
                      <span className="truncate text-[#FAFAFA]">{fow.batterName}</span>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-[#71717A] tabular-nums">
                      {fow.overs} ov
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {innings.partnerships.length > 0 && (
            <section aria-label="Partnerships" className="bl-card p-5">
              <h3 className="font-display text-sm font-semibold text-[#FAFAFA] border-b border-white/[0.07] pb-3">
                Partnerships
              </h3>
              <div className="mt-3 space-y-3.5">
                {innings.partnerships.map((p, idx) => {
                  const total = Math.max(1, p.batter1Runs + p.batter2Runs);
                  const b1Pct = Math.round((p.batter1Runs / total) * 100);
                  return (
                    <div key={`${p.wicketLabel}-${idx}`} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[#71717A]">
                          {p.wicketLabel}
                          {p.isCurrent && (
                            <span className="ml-1.5 font-mono text-[10px] text-[#34D399]">
                              ACTIVE
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-semibold text-[#FAFAFA] tabular-nums">
                          {p.totalRuns} ({p.totalBalls}b)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#A1A1AA]">
                        <span className="truncate">
                          {p.batter1Name}{' '}
                          <span className="font-mono text-[#FAFAFA]">
                            {p.batter1Runs}({p.batter1Balls})
                          </span>
                        </span>
                        <span className="truncate text-right">
                          {p.batter2Name}{' '}
                          <span className="font-mono text-[#FAFAFA]">
                            {p.batter2Runs}({p.batter2Balls})
                          </span>
                        </span>
                      </div>
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className="h-full bg-[#38BDF8]"
                          style={{ width: `${b1Pct}%` }}
                        />
                        <div
                          className="h-full bg-[#A1A1AA]/60"
                          style={{ width: `${100 - b1Pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
