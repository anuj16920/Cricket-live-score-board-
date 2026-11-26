import React from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import type { BallEventType } from '../types/cricket';

interface DemoSimBarProps {
  isLiveMatch: boolean;
  autoPlay: boolean;
  isBusy: boolean;
  onToggleAutoPlay: () => void;
  onSimulate: (eventType?: BallEventType) => void;
  onReset: () => void;
}

const EVENT_TRIGGERS: { type: BallEventType; label: string; accent?: string }[] = [
  { type: 'DOT', label: 'Dot' },
  { type: 'SINGLE', label: '1' },
  { type: 'DOUBLE', label: '2' },
  { type: 'TRIPLE', label: '3' },
  { type: 'FOUR', label: '4', accent: 'hover:border-[#F59E0B]/60 hover:text-[#F59E0B]' },
  { type: 'SIX', label: '6', accent: 'hover:border-[#34D399]/60 hover:text-[#34D399]' },
  { type: 'WICKET', label: 'Wicket', accent: 'hover:border-[#FB7185]/60 hover:text-[#FB7185]' },
  { type: 'WIDE', label: 'WD' },
  { type: 'NO_BALL', label: 'NB' },
  { type: 'BYE', label: 'Bye' },
  { type: 'LEG_BYE', label: 'LB' },
];

export const DemoSimBar: React.FC<DemoSimBarProps> = ({
  isLiveMatch,
  autoPlay,
  isBusy,
  onToggleAutoPlay,
  onSimulate,
  onReset,
}) => {
  return (
    <section
      aria-label="Demo delivery simulator controls"
      className="bl-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xs font-semibold tracking-wider text-[#F59E0B] uppercase">
            Demo Mode · Delivery Simulator
          </p>
          <p className="mt-0.5 text-xs text-[#A1A1AA]">
            Trigger individual deliveries or run auto-simulation to preview live animations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isLiveMatch && (
            <>
              <button
                type="button"
                onClick={onToggleAutoPlay}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  autoPlay
                    ? 'border-[#38BDF8]/50 bg-[#38BDF8]/15 text-[#38BDF8]'
                    : 'border-white/10 bg-[#18181D] text-[#FAFAFA] hover:border-white/25'
                }`}
              >
                {autoPlay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{autoPlay ? 'Pause Live Sim' : 'Auto-Simulate'}</span>
              </button>

              <button
                type="button"
                onClick={() => onSimulate()}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAFAFA] px-3 py-1.5 text-xs font-semibold text-[#09090B] transition-colors hover:bg-white disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Next Ball</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onReset}
            disabled={isBusy}
            aria-label="Reset demo match state"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111114] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] transition-colors hover:border-white/25 hover:text-[#FAFAFA] disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {isLiveMatch && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3.5">
          <span className="mr-1 text-[11px] text-[#71717A]">Test event:</span>
          {EVENT_TRIGGERS.map((btn) => (
            <button
              key={btn.type}
              type="button"
              disabled={isBusy}
              onClick={() => onSimulate(btn.type)}
              className={`rounded-lg border border-white/10 bg-[#111114] px-2.5 py-1 font-mono text-xs font-medium text-[#FAFAFA] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 ${
                btn.accent ?? 'hover:border-white/25 hover:bg-[#18181D]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
