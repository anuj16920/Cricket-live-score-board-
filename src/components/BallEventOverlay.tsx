import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Delivery } from '../types/cricket';

interface BallEventOverlayProps {
  delivery: Delivery | null;
}

export const BallEventOverlay: React.FC<BallEventOverlayProps> = ({ delivery }) => {
  const reduced = useReducedMotion();

  if (!delivery) return null;

  const { eventType, id, wicketDetail, chipLabel } = delivery;

  const isFour = eventType === 'FOUR';
  const isSix = eventType === 'SIX';
  const isWicket = eventType === 'WICKET';
  const isDot = eventType === 'DOT';
  const isRun = eventType === 'SINGLE' || eventType === 'DOUBLE' || eventType === 'TRIPLE';
  const isExtra =
    eventType === 'WIDE' ||
    eventType === 'NO_BALL' ||
    eventType === 'BYE' ||
    eventType === 'LEG_BYE';

  return (
    <AnimatePresence>
      <motion.div
        key={id}
        data-testid="ball-event-overlay"
        data-event-type={eventType}
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[18px]"
      >
        {/* 1. FOUR: Warm gold sweep + particles + FOUR badge */}
        {isFour && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 85% 20%, rgba(245, 158, 11, 0.22), transparent 72%)',
              }}
            />
            {!reduced && (
              <div
                className="bl-sweep absolute inset-y-0 w-1/3"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.22), transparent)',
                }}
              />
            )}
            {!reduced && (
              <div className="absolute right-8 top-6 flex gap-1.5">
                {[0, 1, 2, 3, 4].map((p) => (
                  <motion.span
                    key={p}
                    initial={{ x: -24, y: (p - 2) * 3, opacity: 0, scale: 0.5 }}
                    animate={{ x: 28 + p * 8, y: (p - 2) * 7, opacity: [0, 1, 0], scale: 1 }}
                    transition={{ duration: 0.7, delay: p * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]"
                  />
                ))}
              </div>
            )}
            <motion.div
              initial={reduced ? { opacity: 0 } : { x: 24, opacity: 0, scale: 0.92 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-4 top-4 flex items-center gap-3 rounded-xl border border-[#F59E0B]/45 bg-[#1C160C]/95 px-4 py-2 shadow-xl"
            >
              <span className="font-mono text-2xl font-bold text-[#F59E0B]">4</span>
              <div className="leading-tight">
                <p className="font-display text-xs font-bold tracking-[0.14em] text-[#F59E0B]">
                  FOUR
                </p>
                <p className="text-[11px] text-[#A1A1AA]">Boundary · {delivery.batterName}</p>
              </div>
            </motion.div>
          </>
        )}

        {/* 2. SIX: Emerald/Sky flare + parabolic arc + SIX banner */}
        {isSix && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0.35] }}
              transition={{ duration: 0.75 }}
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 75% 65% at 80% 15%, rgba(52, 211, 153, 0.22) 0%, rgba(56, 189, 248, 0.12) 40%, transparent 75%)',
              }}
            />
            {!reduced && (
              <svg
                viewBox="0 0 320 90"
                className="absolute right-0 top-0 h-28 w-72 opacity-85"
                fill="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M 18 78 Q 160 -8 302 28"
                  stroke="url(#six-arc-grad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 1, 0.5] }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                />
                <defs>
                  <linearGradient id="six-arc-grad" x1="18" y1="78" x2="302" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38BDF8" stopOpacity="0.1" />
                    <stop offset="0.6" stopColor="#34D399" />
                    <stop offset="1" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            <motion.div
              initial={reduced ? { opacity: 0 } : { scale: 0.82, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-4 top-4 flex items-center gap-3 rounded-xl border border-[#34D399]/55 bg-[#0E1C17]/95 px-4 py-2.5 shadow-2xl"
            >
              <span className="font-mono text-3xl font-bold leading-none text-[#34D399]">6</span>
              <div className="leading-tight">
                <p className="font-display text-xs font-extrabold tracking-[0.16em] text-[#34D399]">
                  MAXIMUM SIX
                </p>
                <p className="text-[11px] text-[#FAFAFA]/80">
                  {delivery.batterName} clears the rope
                </p>
              </div>
            </motion.div>
          </>
        )}

        {/* 3. WICKET: Coral crimson flash + falling stumps */}
        {isWicket && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0.45] }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 75% 65% at 85% 20%, rgba(251, 113, 133, 0.22), transparent 72%)',
              }}
            />
            <motion.div
              initial={reduced ? { opacity: 0 } : { y: -12, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-4 top-4 flex items-center gap-3.5 rounded-xl border border-[#FB7185]/50 bg-[#1F1014]/95 px-4 py-2.5 shadow-2xl"
            >
              <svg viewBox="0 0 36 36" className="h-9 w-9 shrink-0" aria-hidden="true">
                <rect x="9" y="10" width="2.6" height="20" rx="1" fill="#FB7185" />
                <rect x="16.5" y="10" width="2.6" height="20" rx="1" fill="#FB7185" />
                <motion.rect
                  x="24"
                  y="10"
                  width="2.6"
                  height="20"
                  rx="1"
                  fill="#FAFAFA"
                  style={{ originX: '25px', originY: '30px' }}
                  initial={reduced ? {} : { rotate: 0 }}
                  animate={reduced ? {} : { rotate: 28, x: 2 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.rect
                  x="10"
                  y="7"
                  width="8"
                  height="2.2"
                  rx="1"
                  fill="#F59E0B"
                  initial={reduced ? {} : { y: 0, rotate: 0 }}
                  animate={reduced ? {} : { y: -5, x: -3, rotate: -34, opacity: 0.6 }}
                  transition={{ duration: 0.5 }}
                />
                <motion.rect
                  x="19"
                  y="7"
                  width="8"
                  height="2.2"
                  rx="1"
                  fill="#F59E0B"
                  initial={reduced ? {} : { y: 0, rotate: 0 }}
                  animate={reduced ? {} : { y: -4, x: 5, rotate: 42, opacity: 0.6 }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="leading-tight">
                <p className="font-display text-xs font-extrabold tracking-[0.16em] text-[#FB7185]">
                  WICKET
                </p>
                <p className="text-xs font-medium text-[#FAFAFA]">
                  {wicketDetail?.dismissedBatterName ?? delivery.batterName}
                </p>
                {wicketDetail?.incomingBatterName && (
                  <p className="text-[11px] text-[#A1A1AA]">
                    In: {wicketDetail.incomingBatterName}
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* 4. DOT BALL */}
        {isDot && (
          <div className="absolute right-4 top-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#18181D]/95 px-3.5 py-2">
            <span className="relative flex h-4 w-4 items-center justify-center">
              {!reduced && (
                <span className="bl-ripple absolute inset-0 rounded-full border border-[#A1A1AA]" />
              )}
              <span className="h-2 w-2 rounded-full bg-[#A1A1AA]" />
            </span>
            <span className="font-mono text-xs font-semibold tracking-wider text-[#A1A1AA]">
              DOT BALL
            </span>
          </div>
        )}

        {/* 5. SINGLE / DOUBLE / TRIPLE */}
        {isRun && (
          <motion.div
            initial={
              reduced
                ? { opacity: 0 }
                : {
                    x: -14,
                    opacity: 0,
                    scale: eventType === 'TRIPLE' ? 0.78 : 0.88,
                  }
            }
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-4 top-4 flex items-center gap-2.5 rounded-xl border border-[#38BDF8]/35 bg-[#18181D]/95 px-3.5 py-2"
          >
            <span className="font-mono text-xl font-bold text-[#38BDF8]">{chipLabel}</span>
            <span className="font-display text-xs font-semibold tracking-wider text-[#FAFAFA]">
              {eventType === 'SINGLE'
                ? 'SINGLE'
                : eventType === 'DOUBLE'
                  ? 'DOUBLE'
                  : 'TRIPLE'}
            </span>
          </motion.div>
        )}

        {/* 6. EXTRAS */}
        {isExtra && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`absolute right-4 top-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2 ${
              eventType === 'NO_BALL'
                ? 'border-[#F59E0B]/45 bg-[#1C160C]/95 text-[#F59E0B]'
                : 'border-[#38BDF8]/35 bg-[#18181D]/95 text-[#38BDF8]'
            }`}
          >
            <span className="font-mono text-sm font-bold">{chipLabel}</span>
            <span className="font-display text-xs font-semibold tracking-wider">
              {eventType === 'WIDE'
                ? 'WIDE BALL'
                : eventType === 'NO_BALL'
                  ? 'NO BALL · FREE HIT'
                  : eventType === 'BYE'
                    ? 'BYE'
                    : 'LEG BYE'}
            </span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
