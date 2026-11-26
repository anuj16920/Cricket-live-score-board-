import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MatchDetail } from '../types/cricket';

interface RunRateChartProps {
  match: MatchDetail;
}

export const RunRateChart: React.FC<RunRateChartProps> = ({ match }) => {
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  const maxOverCount = Math.max(
    inn1?.overProgress.length ?? 0,
    inn2?.overProgress.length ?? 0
  );

  if (maxOverCount < 2) {
    return null;
  }

  const team1 =
    inn1?.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const team2 =
    inn2?.battingTeamId === match.teamA.id ? match.teamA : match.teamB;

  const chartData = Array.from({ length: maxOverCount }, (_, idx) => {
    const over = idx + 1;
    const p1 = inn1?.overProgress.find((p) => p.over === over);
    const p2 = inn2?.overProgress.find((p) => p.over === over);
    return {
      over,
      team1Runs: p1?.cumulativeRuns,
      team2Runs: p2?.cumulativeRuns,
    };
  });

  return (
    <section aria-label="Innings progression worm chart" className="bl-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-[#FAFAFA]">
            Innings Progression
          </h3>
          <p className="text-xs text-[#71717A]">
            Cumulative runs over-by-over
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {inn1 && (
            <span className="flex items-center gap-1.5 text-[#A1A1AA]">
              <span className="h-2 w-2 rounded-full bg-[#A1A1AA]" />
              {team1.shortName}
            </span>
          )}
          {inn2 && (
            <span className="flex items-center gap-1.5 text-[#FAFAFA]">
              <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
              {team2.shortName}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="over"
              tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181D',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#FAFAFA',
              }}
              labelFormatter={(ov) => `Over ${ov}`}
            />
            {inn1 && (
              <Line
                type="monotone"
                dataKey="team1Runs"
                name={team1.shortName}
                stroke="#A1A1AA"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            {inn2 && (
              <Line
                type="monotone"
                dataKey="team2Runs"
                name={team2.shortName}
                stroke="#38BDF8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
