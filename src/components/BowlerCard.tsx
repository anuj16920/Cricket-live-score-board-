import React from 'react';
import type { BowlerEntry } from '../types/cricket';
import { AnimatedNumber } from './AnimatedNumber';

interface BowlerCardProps {
  bowler?: BowlerEntry;
}

export const BowlerCard: React.FC<BowlerCardProps> = ({ bowler }) => {
  return (
    <section aria-label="Current bowling" className="bl-card p-5">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
        <h3 className="font-display text-sm font-semibold text-[#FAFAFA]">
          Current Bowler
        </h3>
        {bowler && (
          <span className="font-mono text-xs text-[#38BDF8] tabular-nums">
            Econ {bowler.economy.toFixed(2)}
          </span>
        )}
      </div>

      {!bowler ? (
        <p className="py-6 text-center text-xs text-[#71717A]">
          No active bowler assigned yet.
        </p>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-base font-semibold text-[#FAFAFA]">
                {bowler.name}
              </p>
              <p className="mt-0.5 text-xs text-[#71717A]">
                Wides: {bowler.wides} · No balls: {bowler.noBalls}
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-bold text-[#FAFAFA] tabular-nums">
                <AnimatedNumber value={bowler.wickets} />
                <span className="text-[#71717A]">/</span>
                <AnimatedNumber value={bowler.runs} />
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2 border-t border-white/[0.06] pt-3.5 text-center">
            <div>
              <p className="text-[11px] text-[#71717A]">Overs</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-[#FAFAFA] tabular-nums">
                {bowler.overs.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#71717A]">Mdns</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-[#A1A1AA] tabular-nums">
                {bowler.maidens}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#71717A]">Runs</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-[#FAFAFA] tabular-nums">
                {bowler.runs}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#71717A]">Wkts</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-[#38BDF8] tabular-nums">
                {bowler.wickets}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#71717A]">Econ</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-[#A1A1AA] tabular-nums">
                {bowler.economy.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
