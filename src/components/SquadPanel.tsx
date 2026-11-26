import React, { useState } from 'react';
import type { Player, Team } from '../types/cricket';
import { TeamBadge } from './TeamBadge';

interface SquadPanelProps {
  teamA: Team;
  teamB: Team;
}

const PlayerRow: React.FC<{ player: Player; primaryColor: string }> = ({
  player,
  primaryColor,
}) => {
  const [imgErr, setImgErr] = useState(false);
  const initials = player.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="group flex items-center gap-3.5 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-white/[0.07] hover:bg-white/[0.025]">
      {player.photoUrl && !imgErr ? (
        <img
          src={player.photoUrl}
          alt={player.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgErr(true)}
          className="h-10 w-10 shrink-0 rounded-xl border border-white/10 object-cover transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111114] font-mono text-xs font-semibold transition-transform duration-200 group-hover:scale-105"
          style={{ color: primaryColor }}
        >
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-display text-sm font-semibold text-[#FAFAFA]">
            {player.name}
          </p>
          {player.isCaptain && (
            <span className="font-mono text-[11px] font-bold text-[#F59E0B]" title="Captain">
              (C)
            </span>
          )}
          {player.isWicketkeeper && (
            <span className="font-mono text-[11px] font-bold text-[#38BDF8]" title="Wicketkeeper">
              (WK)
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-[#71717A]">
          <span className="text-[#A1A1AA]">{player.role}</span>
          {player.battingStyle && ` · ${player.battingStyle}`}
          {player.bowlingStyle && ` · ${player.bowlingStyle}`}
        </p>
      </div>
    </div>
  );
};

const TeamRosterColumn: React.FC<{ team: Team }> = ({ team }) => {
  const playingXI = team.squad.filter((p) => !p.isSubstitute);
  const substitutes = team.squad.filter((p) => p.isSubstitute);
  const captain = team.squad.find((p) => p.isCaptain || p.id === team.captainId);
  const keeper = team.squad.find((p) => p.isWicketkeeper || p.id === team.wicketkeeperId);

  return (
    <section aria-label={`${team.name} squad`} className="bl-card p-5">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <TeamBadge
            name={team.name}
            shortName={team.shortName}
            primaryColor={team.primaryColor}
            secondaryColor={team.secondaryColor}
            logoUrl={team.logoUrl}
            size="md"
          />
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold text-[#FAFAFA]">
              {team.name}
            </h3>
            <p className="truncate text-xs text-[#71717A]">
              {team.region ? `${team.region} · ` : ''}
              {playingXI.length} Playing XI
            </p>
          </div>
        </div>
      </div>

      {(captain || keeper) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/[0.06] pb-3 text-xs text-[#A1A1AA]">
          {captain && (
            <span>
              Captain: <strong className="text-[#FAFAFA]">{captain.name}</strong>
            </span>
          )}
          {keeper && (
            <span>
              Keeper: <strong className="text-[#FAFAFA]">{keeper.name}</strong>
            </span>
          )}
        </div>
      )}

      {playingXI.length === 0 ? (
        <p className="py-8 text-center text-xs text-[#71717A]">
          Playing XI has not been announced yet.
        </p>
      ) : (
        <div className="mt-3 space-y-1">
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
            Playing XI
          </p>
          {playingXI.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              primaryColor={team.primaryColor}
            />
          ))}
        </div>
      )}

      {substitutes.length > 0 && (
        <div className="mt-5 border-t border-white/[0.07] pt-4 space-y-1">
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
            Substitutes / Bench
          </p>
          {substitutes.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              primaryColor={team.primaryColor}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export const SquadPanel: React.FC<SquadPanelProps> = ({ teamA, teamB }) => {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <TeamRosterColumn team={teamA} />
      <TeamRosterColumn team={teamB} />
    </div>
  );
};
