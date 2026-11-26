import React from 'react';
import type { MatchDetail } from '../types/cricket';

interface MatchInformationProps {
  match: MatchDetail;
}

interface InfoRow {
  label: string;
  value?: string;
}

export const MatchInformation: React.FC<MatchInformationProps> = ({ match }) => {
  const startDate = new Date(match.startTime);
  const formattedStart = Number.isNaN(startDate.getTime())
    ? undefined
    : startDate.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const matchDetails: InfoRow[] = [
    { label: 'Tournament', value: match.tournamentName },
    { label: 'Match', value: match.matchNumber },
    { label: 'Format', value: match.format },
    { label: 'Start Date & Time', value: formattedStart },
    {
      label: 'Toss',
      value: match.toss
        ? `${match.toss.winnerName} won the toss and elected to ${match.toss.decision}`
        : undefined,
    },
    {
      label: 'Data Source',
      value:
        match.dataMode === 'demo'
          ? 'Demo Mode (Simulated Fictional Match)'
          : 'Sportmonks Cricket API v2.0',
    },
  ].filter((row) => Boolean(row.value));

  const venueDetails: InfoRow[] = [
    { label: 'Venue', value: match.venue.name },
    { label: 'Stadium', value: match.venue.stadium },
    { label: 'City', value: match.venue.city },
    { label: 'Country', value: match.venue.country },
    {
      label: 'Capacity',
      value: match.venue.capacity ? match.venue.capacity.toLocaleString() : undefined,
    },
  ].filter((row) => Boolean(row.value));

  const officialsDetails: InfoRow[] = [
    {
      label: 'On-Field Umpires',
      value:
        match.officials?.umpires && match.officials.umpires.length > 0
          ? match.officials.umpires.join(', ')
          : undefined,
    },
    { label: 'Third Umpire', value: match.officials?.thirdUmpire },
    { label: 'Match Referee', value: match.officials?.matchReferee },
  ].filter((row) => Boolean(row.value));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section aria-label="Match details" className="bl-card p-5">
        <h3 className="font-display text-sm font-semibold text-[#FAFAFA] border-b border-white/[0.07] pb-3">
          Match Details
        </h3>
        <dl className="mt-3 divide-y divide-white/[0.06] text-xs sm:text-sm">
          {matchDetails.map((row) => (
            <div key={row.label} className="flex flex-col sm:flex-row sm:justify-between gap-1 py-3">
              <dt className="text-[#71717A]">{row.label}</dt>
              <dd className="font-medium text-[#FAFAFA] sm:text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="space-y-5">
        <section aria-label="Venue details" className="bl-card p-5">
          <h3 className="font-display text-sm font-semibold text-[#FAFAFA] border-b border-white/[0.07] pb-3">
            Venue &amp; Stadium
          </h3>
          <dl className="mt-3 divide-y divide-white/[0.06] text-xs sm:text-sm">
            {venueDetails.map((row) => (
              <div key={row.label} className="flex flex-col sm:flex-row sm:justify-between gap-1 py-3">
                <dt className="text-[#71717A]">{row.label}</dt>
                <dd className="font-medium text-[#FAFAFA] sm:text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {officialsDetails.length > 0 && (
          <section aria-label="Match officials" className="bl-card p-5">
            <h3 className="font-display text-sm font-semibold text-[#FAFAFA] border-b border-white/[0.07] pb-3">
              Match Officials
            </h3>
            <dl className="mt-3 divide-y divide-white/[0.06] text-xs sm:text-sm">
              {officialsDetails.map((row) => (
                <div key={row.label} className="flex flex-col sm:flex-row sm:justify-between gap-1 py-3">
                  <dt className="text-[#71717A]">{row.label}</dt>
                  <dd className="font-medium text-[#FAFAFA] sm:text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
};
