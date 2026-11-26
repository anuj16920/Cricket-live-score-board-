import React from 'react';
import type { ApiStatus } from '../types/cricket';

interface AboutViewProps {
  apiStatus?: ApiStatus;
}

export const AboutView: React.FC<AboutViewProps> = ({ apiStatus }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
          About BOUNDARYLIVE
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#A1A1AA]">
          A modern live cricket scoreboard and match centre designed for T20, ODI, and Test
          cricket with real-time ball-by-ball animations, complete scorecards, full team squads,
          and live standings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="bl-card p-6">
          <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
            Live Data Architecture
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
            All external cricket data requests route through server-side Express API endpoints
            backed by a pluggable provider interface. When a Sportmonks Cricket API v2.0 token is
            configured in server environment secrets, BOUNDARYLIVE fetches live fixtures, lineups,
            scorecards, balls, and standings securely from the server.
          </p>
          <div className="mt-4 border-t border-white/[0.07] pt-3.5 text-xs text-[#71717A] space-y-1.5">
            <p>
              Active Mode:{' '}
              <strong className="font-mono text-[#FAFAFA]">
                {apiStatus?.mode === 'live' ? 'LIVE API' : 'DEMO MODE'}
              </strong>
            </p>
            <p>
              Provider:{' '}
              <strong className="text-[#A1A1AA]">
                {apiStatus?.provider ?? 'BOUNDARYLIVE Demo Simulator'}
              </strong>
            </p>
          </div>
        </section>

        <section className="bl-card p-6">
          <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
            Delivery Animation Engine
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
            Every ball outcome — Dot, Single, Double, Triple, Four, Six, Wicket, Wide, No Ball,
            Bye, and Leg Bye — has its own crisp broadcast overlay animation. Click any ball chip
            inside Commentary to preview its animation on the scoreboard.
          </p>
          <div className="mt-4 border-t border-white/[0.07] pt-3.5 text-xs text-[#71717A] space-y-1.5">
            <p>Polling cadence: 15s active tab · auto-paused when tab hidden</p>
            <p>Deduplication: Delivery ID tracking prevents replaying old balls on refresh</p>
          </div>
        </section>

        <section className="bl-card p-6 md:col-span-2">
          <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
            Supported Formats
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
            <div className="rounded-xl border border-white/[0.06] bg-[#111114] p-4">
              <p className="font-mono text-xs font-semibold text-[#38BDF8]">T20 CRICKET</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#A1A1AA]">
                20-over chase progress, required run rate comparison, delivery chips, and innings
                worm chart.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#111114] p-4">
              <p className="font-mono text-xs font-semibold text-[#34D399]">ONE-DAY (ODI)</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#A1A1AA]">
                50-over pacing telemetry, full batting/bowling cards, fall of wickets, and
                partnership breakdowns.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#111114] p-4">
              <p className="font-mono text-xs font-semibold text-[#F59E0B]">TEST CRICKET</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#A1A1AA]">
                Multi-innings switching, session calculations, maiden tracking, and complete
                Playing XI rosters.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
