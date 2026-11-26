import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Delivery } from '../types/cricket';
import { getDeliveryChipStyle } from './CurrentOver';

interface CommentaryFeedProps {
  deliveries: Delivery[];
  onReplayDelivery?: (delivery: Delivery) => void;
}

function formatDeliveryTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const CommentaryFeed: React.FC<CommentaryFeedProps> = ({
  deliveries,
  onReplayDelivery,
}) => {
  const [filter, setFilter] = useState<'all' | 'highlights'>('all');

  const visible =
    filter === 'highlights'
      ? deliveries.filter((d) => d.isBoundaryFour || d.isBoundarySix || d.isWicket)
      : deliveries;

  return (
    <section aria-label="Live ball-by-ball commentary" className="bl-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5">
        <div>
          <h3 className="font-display text-sm font-semibold text-[#FAFAFA]">
            Ball-by-Ball Commentary
          </h3>
          <p className="text-xs text-[#71717A]">
            Select any ball chip to replay its animation
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#111114] p-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              filter === 'all'
                ? 'bg-[#1D1D24] text-[#FAFAFA]'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            All ({deliveries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('highlights')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              filter === 'highlights'
                ? 'bg-[#1D1D24] text-[#F59E0B]'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            Highlights
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#71717A]">
          {filter === 'highlights'
            ? 'No boundaries or wickets in the feed yet.'
            : 'Ball-by-ball commentary will appear once play begins.'}
        </p>
      ) : (
        <div className="mt-3 divide-y divide-white/[0.06] max-h-[520px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {visible.map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3.5 py-3.5"
              >
                <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                  <span className="font-mono text-xs font-semibold text-[#A1A1AA] tabular-nums">
                    {d.overLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onReplayDelivery?.(d)}
                    title="Replay delivery animation on scoreboard"
                    aria-label={`Replay ${d.eventType} animation for over ${d.overLabel}`}
                    className={`flex h-7 min-w-8 items-center justify-center rounded-lg border px-1.5 font-mono text-xs font-bold tabular-nums transition-transform hover:scale-105 ${getDeliveryChipStyle(
                      d.eventType
                    )}`}
                  >
                    {d.chipLabel}
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-[#A1A1AA]">
                      <span className="text-[#FAFAFA]">{d.bowlerName}</span> to{' '}
                      <span className="text-[#FAFAFA]">{d.batterName}</span>
                    </p>
                    <span className="font-mono text-[11px] text-[#71717A] tabular-nums">
                      {formatDeliveryTime(d.timestamp)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-relaxed text-[#FAFAFA]/90">
                    {d.commentary}
                  </p>

                  {d.isWicket && d.wicketDetail && (
                    <div className="mt-2 rounded-lg border border-[#FB7185]/30 bg-[#FB7185]/10 px-3 py-1.5 text-xs">
                      <span className="font-semibold text-[#FB7185]">
                        OUT: {d.wicketDetail.dismissedBatterName}
                      </span>{' '}
                      <span className="text-[#A1A1AA]">({d.wicketDetail.dismissalText})</span>
                      {d.wicketDetail.incomingBatterName && (
                        <span className="text-[#A1A1AA]">
                          {' '}
                          · Incoming: <strong className="text-[#FAFAFA]">{d.wicketDetail.incomingBatterName}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};
