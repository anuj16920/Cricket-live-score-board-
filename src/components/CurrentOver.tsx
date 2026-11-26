import React from 'react';
import { motion } from 'motion/react';
import type { BallEventType, Delivery } from '../types/cricket';

interface CurrentOverProps {
  balls: Delivery[];
  overNumber?: number;
}

export function getDeliveryChipStyle(eventType: BallEventType): string {
  switch (eventType) {
    case 'FOUR':
      return 'border-[#F59E0B]/55 bg-[#F59E0B]/18 text-[#F59E0B]';
    case 'SIX':
      return 'border-[#34D399]/60 bg-[#34D399]/20 text-[#34D399]';
    case 'WICKET':
      return 'border-[#FB7185]/60 bg-[#FB7185]/20 text-[#FB7185]';
    case 'DOT':
      return 'border-white/10 bg-white/[0.04] text-[#A1A1AA]';
    case 'WIDE':
    case 'NO_BALL':
      return 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#F59E0B]';
    case 'BYE':
    case 'LEG_BYE':
      return 'border-[#38BDF8]/40 bg-[#38BDF8]/12 text-[#38BDF8]';
    case 'TRIPLE':
      return 'border-[#34D399]/35 bg-[#34D399]/10 text-[#FAFAFA]';
    case 'DOUBLE':
      return 'border-[#38BDF8]/35 bg-[#38BDF8]/12 text-[#FAFAFA]';
    case 'SINGLE':
    default:
      return 'border-white/12 bg-[#18181D] text-[#FAFAFA]';
  }
}

export const CurrentOver: React.FC<CurrentOverProps> = ({ balls, overNumber }) => {
  const overRuns = balls.reduce((sum, b) => sum + b.totalRuns, 0);
  const legalCount = balls.filter((b) => b.isLegalDelivery).length;
  const remainingSlots = Math.max(0, 6 - legalCount);

  return (
    <section aria-label="This over" className="bl-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-[#FAFAFA]">This Over</h3>
          {overNumber !== undefined && (
            <span className="font-mono text-xs text-[#71717A]">
              Over {overNumber + 1}
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-[#A1A1AA] tabular-nums">
          {overRuns} run{overRuns === 1 ? '' : 's'}
        </span>
      </div>

      <div
        className="mt-4 flex items-center gap-2 overflow-x-auto pb-1"
        role="list"
        aria-label="Deliveries in current over"
      >
        {balls.map((ball) => (
          <motion.div
            key={ball.id}
            role="listitem"
            initial={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            title={`${ball.overLabel}: ${ball.eventType} — ${ball.batterName}`}
            className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border px-2 font-mono text-sm font-bold tabular-nums ${getDeliveryChipStyle(
              ball.eventType
            )}`}
          >
            {ball.chipLabel}
          </motion.div>
        ))}

        {Array.from({ length: remainingSlots }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/[0.09] bg-white/[0.015] font-mono text-xs text-[#71717A]/50"
          >
            ·
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#71717A]">
        <span>
          <strong className="font-mono text-[#F59E0B]">4</strong> Four
        </span>
        <span>
          <strong className="font-mono text-[#34D399]">6</strong> Six
        </span>
        <span>
          <strong className="font-mono text-[#FB7185]">W</strong> Wicket
        </span>
        <span>
          <strong className="font-mono text-[#38BDF8]">B/LB</strong> Byes
        </span>
        <span>
          <strong className="font-mono text-[#F59E0B]">WD/NB</strong> Extras
        </span>
      </div>
    </section>
  );
};
