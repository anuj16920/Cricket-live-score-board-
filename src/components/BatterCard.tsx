import React from 'react';
import type { BatterEntry, Partnership } from '../types/cricket';
import { AnimatedNumber } from './AnimatedNumber';

interface BatterCardProps {
  batters: BatterEntry[];
  activePartnership?: Partnership;
}

export const BatterCard: React.FC<BatterCardProps> = ({ batters, activePartnership }) => {
  return (
    <section aria-label="Current batting" className="bl-card p-5">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
        <h3 className="font-display text-sm font-semibold text-[#FAFAFA]">
          Current Batting
        </h3>
        {activePartnership && (
          <span className="font-mono text-xs text-[#A1A1AA] tabular-nums">
            Partnership:{' '}
            <strong className="text-[#FAFAFA]">{activePartnership.totalRuns}</strong> (
            {activePartnership.totalBalls}b)
          </span>
        )}
      </div>

      {batters.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#71717A]">
          No active batters at the crease.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="text-[11px] text-[#71717A]">
                <th className="pb-2 font-medium">Batter</th>
                <th className="pb-2 text-right font-medium">R</th>
                <th className="pb-2 text-right font-medium">B</th>
                <th className="pb-2 text-right font-medium">4s</th>
                <th className="pb-2 text-right font-medium">6s</th>
                <th className="pb-2 text-right font-medium">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {batters.map((b) => (
                <tr
                  key={b.playerId}
                  className={b.isOnStrike ? 'bg-[#38BDF8]/[0.05]' : ''}
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        title={b.isOnStrike ? 'On strike' : 'Non-striker'}
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          b.isOnStrike ? 'bg-[#38BDF8]' : 'bg-white/15'
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          b.isOnStrike ? 'text-[#FAFAFA]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        {b.name}
                      </span>
                      {b.isOnStrike && (
                        <span className="font-mono text-[10px] font-semibold text-[#38BDF8]">
                          *
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-[#FAFAFA] tabular-nums">
                    <AnimatedNumber value={b.runs} />
                  </td>
                  <td className="py-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {b.balls}
                  </td>
                  <td className="py-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {b.fours}
                  </td>
                  <td className="py-3 text-right font-mono text-[#A1A1AA] tabular-nums">
                    {b.sixes}
                  </td>
                  <td className="py-3 text-right font-mono text-[#38BDF8] tabular-nums">
                    {b.strikeRate.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
