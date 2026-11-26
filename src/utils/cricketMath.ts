import type {
  BallEventType,
  BatterEntry,
  Delivery,
  ExtraType,
  MatchDetail,
  MatchSummary,
  Player,
} from '../types/cricket';

/** Convert cricket overs (e.g. 18.2 -> 110 legal balls). */
export function oversToBalls(overs: number): number {
  const whole = Math.floor(overs);
  const partial = Math.round((overs - whole) * 10);
  return whole * 6 + Math.min(Math.max(partial, 0), 5);
}

/** Convert legal balls count to cricket overs display string (e.g. 110 -> "18.2"). */
export function ballsToOversDisplay(legalBalls: number): string {
  const safeBalls = Math.max(0, Math.floor(legalBalls));
  const whole = Math.floor(safeBalls / 6);
  const rem = safeBalls % 6;
  return `${whole}.${rem}`;
}

/** Convert legal balls count to numeric cricket overs notation (e.g. 110 -> 18.2). */
export function ballsToOversNumber(legalBalls: number): number {
  const safeBalls = Math.max(0, Math.floor(legalBalls));
  const whole = Math.floor(safeBalls / 6);
  const rem = safeBalls % 6;
  return Number(`${whole}.${rem}`);
}

/** Calculate run rate (runs per over) rounded to 2 decimals. */
export function calculateRunRate(runs: number, legalBalls: number): number {
  if (legalBalls <= 0) return 0;
  return Number(((runs * 6) / legalBalls).toFixed(2));
}

/** Calculate required run rate given target, current runs, and balls remaining. */
export function calculateRequiredRunRate(
  target: number,
  currentRuns: number,
  remainingBalls: number
): number {
  const runsNeeded = Math.max(0, target - currentRuns);
  if (runsNeeded === 0) return 0;
  if (remainingBalls <= 0) return 0;
  return Number(((runsNeeded * 6) / remainingBalls).toFixed(2));
}

/** Calculate batter strike rate rounded to 2 decimals. */
export function calculateStrikeRate(runs: number, ballsFaced: number): number {
  if (ballsFaced <= 0) return 0;
  return Number(((runs / ballsFaced) * 100).toFixed(2));
}

/** Calculate bowler economy rate rounded to 2 decimals. */
export function calculateEconomy(runsConceded: number, legalBallsBowled: number): number {
  if (legalBallsBowled <= 0) return 0;
  return Number(((runsConceded * 6) / legalBallsBowled).toFixed(2));
}

/** Classify a ball delivery into one of the 11 canonical BallEventTypes + display chip label. */
export function classifyDelivery(params: {
  runsOffBat: number;
  extraRuns: number;
  extraType: ExtraType;
  isWicket: boolean;
  isBoundaryFour?: boolean;
  isBoundarySix?: boolean;
}): { eventType: BallEventType; chipLabel: string } {
  const { runsOffBat, extraRuns, extraType, isWicket, isBoundaryFour, isBoundarySix } = params;

  if (isWicket) {
    return { eventType: 'WICKET', chipLabel: 'W' };
  }
  if (extraType === 'wide') {
    const total = Math.max(1, extraRuns);
    return { eventType: 'WIDE', chipLabel: total > 1 ? `${total}WD` : 'WD' };
  }
  if (extraType === 'noball') {
    const total = runsOffBat + Math.max(1, extraRuns);
    return { eventType: 'NO_BALL', chipLabel: total > 1 ? `${total}NB` : 'NB' };
  }
  if (extraType === 'bye') {
    const total = Math.max(1, extraRuns);
    return { eventType: 'BYE', chipLabel: `${total}B` };
  }
  if (extraType === 'legbye') {
    const total = Math.max(1, extraRuns);
    return { eventType: 'LEG_BYE', chipLabel: `${total}LB` };
  }
  if (isBoundarySix || runsOffBat >= 6) {
    return { eventType: 'SIX', chipLabel: '6' };
  }
  if (isBoundaryFour || runsOffBat === 4) {
    return { eventType: 'FOUR', chipLabel: '4' };
  }
  if (runsOffBat === 3) {
    return { eventType: 'TRIPLE', chipLabel: '3' };
  }
  if (runsOffBat === 2) {
    return { eventType: 'DOUBLE', chipLabel: '2' };
  }
  if (runsOffBat === 1) {
    return { eventType: 'SINGLE', chipLabel: '1' };
  }
  return { eventType: 'DOT', chipLabel: '0' };
}

/**
 * Deduplicate incoming deliveries against previously seen delivery IDs.
 * Returns ONLY genuinely new deliveries in chronological order (oldest new -> newest new).
 * On initial hydration (`hasHydrated === false`), returns empty array so page reloads
 * never replay old animations.
 */
export function detectNewDeliveries(
  seenIds: ReadonlySet<string>,
  incomingNewestFirst: readonly Delivery[],
  hasHydrated: boolean
): Delivery[] {
  if (!hasHydrated) return [];
  const fresh: Delivery[] = [];
  for (const delivery of incomingNewestFirst) {
    if (!seenIds.has(delivery.id)) {
      fresh.push(delivery);
    }
  }
  return fresh.reverse();
}

/** Compute capped exponential backoff interval in milliseconds for polling retries. */
export function calculateNextBackoffMs(
  consecutiveFailures: number,
  baseMs = 15000,
  maxMs = 120000
): number {
  if (consecutiveFailures <= 0) return baseMs;
  const delay = baseMs * Math.pow(2, consecutiveFailures);
  return Math.min(delay, maxMs);
}

/** Extract lightweight MatchSummary from full MatchDetail. */
export function toMatchSummary(detail: MatchDetail): MatchSummary {
  const { teamA, teamB, innings, deliveries } = detail;
  const teamAScores = innings
    .filter((inn) => inn.battingTeamId === teamA.id)
    .map((inn) => ({
      label: inn.label,
      score: `${inn.runs}/${inn.wickets}`,
      overs: inn.oversDisplay,
    }));
  const teamBScores = innings
    .filter((inn) => inn.battingTeamId === teamB.id)
    .map((inn) => ({
      label: inn.label,
      score: `${inn.runs}/${inn.wickets}`,
      overs: inn.oversDisplay,
    }));

  return {
    id: detail.id,
    tournamentId: detail.tournamentId,
    tournamentName: detail.tournamentName,
    matchNumber: detail.matchNumber,
    format: detail.format,
    status: detail.status,
    statusText: detail.statusText,
    startTime: detail.startTime,
    venue: detail.venue,
    teamA: {
      id: teamA.id,
      name: teamA.name,
      shortName: teamA.shortName,
      region: teamA.region,
      primaryColor: teamA.primaryColor,
      secondaryColor: teamA.secondaryColor,
      logoUrl: teamA.logoUrl,
      captainId: teamA.captainId,
      wicketkeeperId: teamA.wicketkeeperId,
    },
    teamB: {
      id: teamB.id,
      name: teamB.name,
      shortName: teamB.shortName,
      region: teamB.region,
      primaryColor: teamB.primaryColor,
      secondaryColor: teamB.secondaryColor,
      logoUrl: teamB.logoUrl,
      captainId: teamB.captainId,
      wicketkeeperId: teamB.wicketkeeperId,
    },
    teamAScores,
    teamBScores,
    currentInningsNumber: detail.currentInningsNumber,
    currentRunRate: detail.currentRunRate,
    requiredRunRate: detail.requiredRunRate,
    target: detail.target,
    requiredRuns: detail.requiredRuns,
    remainingBalls: detail.remainingBalls,
    recentBalls: deliveries.slice(0, 6).reverse().map((d) => ({
      id: d.id,
      chipLabel: d.chipLabel,
      eventType: d.eventType,
    })),
    winningTeamId: detail.winningTeamId,
    resultMargin: detail.resultMargin,
    isFeatured: detail.isFeatured,
    dataMode: detail.dataMode,
    lastUpdated: detail.lastUpdated,
  };
}

const COMMENTARY_TEMPLATES: Record<BallEventType, string[]> = {
  DOT: [
    'Back of a length on off stump, defended solidly back down the pitch.',
    'Skids through on a tight fourth-stump channel, beaten outside the edge.',
    'Good length, pushed firmly to mid-off for no run. Sharp fielding cuts it off.',
  ],
  SINGLE: [
    'Tapped softly into the gap at cover point for a brisk single.',
    'Worked off the pads through square leg, easy rotation of strike.',
    'Driven down to long-on, batters jog through comfortably for one.',
  ],
  DOUBLE: [
    'Punched through deep extra cover, great running turns it into two.',
    'Flicked with supple wrists behind square leg, back easily for the second.',
  ],
  TRIPLE: [
    'Timed sweetly through wide mid-wicket, long chase to the rope yields three runs.',
    'Pierces the gap at deep point, fielder dives at the boundary to save one — three taken.',
  ],
  FOUR: [
    'Crunched through extra cover! Races across the fast outfield to the boundary.',
    'Short and wide, cut ferociously past backward point for four.',
    'Full on middle, lofted cleanly over mid-on and bounces once into the rope.',
  ],
  SIX: [
    'High and handsome! Cleared the front leg and dispatched deep over long-on for SIX.',
    'Picked up effortlessly off the hip and launched ten rows back over square leg!',
    'Right in the slot — hammered straight back over the sightscreen for a towering maximum.',
  ],
  WICKET: [
    'OUT! Castled! Clean through the gate, off stump cartwheels out of the ground.',
    'OUT! Mistimed loft toward deep mid-wicket, fielder settles under it for a sharp catch.',
    'OUT! Feather edge behind to the keeper! Instant appeal and the finger goes up.',
  ],
  WIDE: [
    'Drifting down the leg side beyond the tramline, umpire stretches arms for wide.',
    'Too wide outside off stump, left alone for an extra run.',
  ],
  NO_BALL: [
    'Overstepped at the popping crease! Siren sounds — no ball and a free hit coming up.',
  ],
  BYE: [
    'Beats both bat and keeper off the seam, batters sneak a sharp bye.',
  ],
  LEG_BYE: [
    'Struck on the front pad sliding down leg, deflects fine for a leg bye.',
  ],
};

/**
 * Pure immutable delivery engine for Demo Mode.
 * Applies a delivery event to a live MatchDetail and returns a brand-new MatchDetail.
 */
export function applyDeliveryToMatch(
  match: MatchDetail,
  eventType: BallEventType,
  nowIso: string = new Date().toISOString()
): { match: MatchDetail; delivery: Delivery } {
  const clone: MatchDetail = structuredClone(match);
  const inn = clone.innings.find((i) => i.inningsNumber === clone.currentInningsNumber)
    ?? clone.innings[clone.innings.length - 1];

  if (!inn) {
    throw new Error('Cannot simulate delivery without an active innings');
  }

  const battingTeam = inn.battingTeamId === clone.teamA.id ? clone.teamA : clone.teamB;
  const bowlingTeam = inn.bowlingTeamId === clone.teamA.id ? clone.teamA : clone.teamB;

  let striker = inn.battingCard.find((b) => b.isAtCrease && b.isOnStrike)
    ?? inn.battingCard.find((b) => !b.isOut);
  let nonStriker = inn.battingCard.find((b) => b.isAtCrease && !b.isOnStrike && b.playerId !== striker?.playerId);

  if (!striker) {
    throw new Error('No active striker found');
  }

  let bowler = inn.bowlingCard.find((b) => b.isCurrentBowler) ?? inn.bowlingCard[0];
  if (!bowler) {
    throw new Error('No active bowler found');
  }

  // Determine delivery specifics from eventType
  let runsOffBat = 0;
  let extraRuns = 0;
  let extraType: ExtraType = null;
  let isLegalDelivery = true;
  let isBoundaryFour = false;
  let isBoundarySix = false;
  let isWicket = false;

  switch (eventType) {
    case 'DOT':
      break;
    case 'SINGLE':
      runsOffBat = 1;
      break;
    case 'DOUBLE':
      runsOffBat = 2;
      break;
    case 'TRIPLE':
      runsOffBat = 3;
      break;
    case 'FOUR':
      runsOffBat = 4;
      isBoundaryFour = true;
      break;
    case 'SIX':
      runsOffBat = 6;
      isBoundarySix = true;
      break;
    case 'WICKET':
      isWicket = true;
      break;
    case 'WIDE':
      extraRuns = 1;
      extraType = 'wide';
      isLegalDelivery = false;
      break;
    case 'NO_BALL':
      extraRuns = 1;
      extraType = 'noball';
      isLegalDelivery = false;
      break;
    case 'BYE':
      extraRuns = 1;
      extraType = 'bye';
      break;
    case 'LEG_BYE':
      extraRuns = 1;
      extraType = 'legbye';
      break;
  }

  const totalRuns = runsOffBat + extraRuns;
  const { chipLabel } = classifyDelivery({
    runsOffBat,
    extraRuns,
    extraType,
    isWicket,
    isBoundaryFour,
    isBoundarySix,
  });

  // Compute over/ball label
  const currentCompletedOvers = Math.floor(inn.legalBalls / 6);
  const currentBallCountInOver = inn.legalBalls % 6;
  const displayBallInOver = isLegalDelivery ? currentBallCountInOver + 1 : Math.max(1, currentBallCountInOver);
  const overLabel = `${currentCompletedOvers}.${displayBallInOver}`;

  // Update innings runs & extras
  inn.runs += totalRuns;
  if (extraType === 'wide') inn.extras.wides += extraRuns;
  if (extraType === 'noball') inn.extras.noBalls += extraRuns;
  if (extraType === 'bye') inn.extras.byes += extraRuns;
  if (extraType === 'legbye') inn.extras.legByes += extraRuns;
  inn.extras.total =
    inn.extras.wides + inn.extras.noBalls + inn.extras.byes + inn.extras.legByes + inn.extras.penalty;

  if (isLegalDelivery) {
    inn.legalBalls += 1;
  }
  inn.oversDisplay = ballsToOversDisplay(inn.legalBalls);
  inn.runRate = calculateRunRate(inn.runs, inn.legalBalls);

  // Update striker stats
  if (extraType !== 'wide') {
    striker.balls += 1;
  }
  striker.runs += runsOffBat;
  if (isBoundaryFour) striker.fours += 1;
  if (isBoundarySix) striker.sixes += 1;
  striker.strikeRate = calculateStrikeRate(striker.runs, striker.balls);

  // Update bowler stats
  const bowlerConceded = extraType === 'bye' || extraType === 'legbye' ? 0 : totalRuns;
  bowler.runs += bowlerConceded;
  if (extraType === 'wide') bowler.wides += 1;
  if (extraType === 'noball') bowler.noBalls += 1;
  if (isLegalDelivery) {
    bowler.ballsBowled += 1;
  }
  bowler.overs = ballsToOversNumber(bowler.ballsBowled);
  if (isWicket) {
    bowler.wickets += 1;
  }
  bowler.economy = calculateEconomy(bowler.runs, bowler.ballsBowled);

  // Update current partnership
  const activePartnership = inn.partnerships.find((p) => p.isCurrent);
  if (activePartnership) {
    activePartnership.totalRuns += totalRuns;
    if (isLegalDelivery) activePartnership.totalBalls += 1;
    if (activePartnership.batter1Name === striker.name) {
      activePartnership.batter1Runs += runsOffBat;
      if (extraType !== 'wide') activePartnership.batter1Balls += 1;
    } else if (activePartnership.batter2Name === striker.name) {
      activePartnership.batter2Runs += runsOffBat;
      if (extraType !== 'wide') activePartnership.batter2Balls += 1;
    }
  }

  // Handle wicket dismissal and incoming batter
  let wicketDetail: Delivery['wicketDetail'];
  if (isWicket) {
    inn.wickets += 1;
    const dismissalText = `b ${bowler.name}`;
    striker.isOut = true;
    striker.isAtCrease = false;
    striker.isOnStrike = false;
    striker.dismissal = dismissalText;

    inn.fallOfWickets.push({
      wicketNumber: inn.wickets,
      score: inn.runs,
      overs: inn.oversDisplay,
      batterName: striker.name,
    });

    if (activePartnership) {
      activePartnership.isCurrent = false;
    }

    // Bring in next batter from didNotBat / squad
    const nextBatterName = inn.didNotBat.shift();
    let incomingBatter: BatterEntry | undefined;
    if (nextBatterName && inn.wickets < 10) {
      const squadPlayer: Player | undefined = battingTeam.squad.find(
        (p) => p.name === nextBatterName
      );
      incomingBatter = {
        playerId: squadPlayer?.id ?? `sim-p-${inn.wickets + 2}`,
        name: nextBatterName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        dismissal: 'not out',
        isOut: false,
        isAtCrease: true,
        isOnStrike: true,
      };
      inn.battingCard.push(incomingBatter);

      if (nonStriker) {
        inn.partnerships.push({
          wicketLabel: `${inn.wickets + 1}${getOrdinal(inn.wickets + 1)} wicket`,
          batter1Name: incomingBatter.name,
          batter1Runs: 0,
          batter1Balls: 0,
          batter2Name: nonStriker.name,
          batter2Runs: 0,
          batter2Balls: 0,
          totalRuns: 0,
          totalBalls: 0,
          isCurrent: true,
        });
      }
    }

    wicketDetail = {
      dismissedBatterName: striker.name,
      dismissalText,
      incomingBatterName: incomingBatter?.name,
    };

    if (incomingBatter) {
      striker = incomingBatter;
    }
  } else {
    // Rotate strike on odd runs (runsOffBat or bye/legbye)
    const ranRuns = extraType === 'bye' || extraType === 'legbye' ? extraRuns : runsOffBat;
    if (ranRuns % 2 === 1 && nonStriker) {
      striker.isOnStrike = false;
      nonStriker.isOnStrike = true;
      const tmp = striker;
      striker = nonStriker;
      nonStriker = tmp;
    }
  }

  // Pick deterministic commentary text
  const templates = COMMENTARY_TEMPLATES[eventType];
  const idx = (inn.legalBalls + inn.runs + clone.deliveries.length) % templates.length;
  const commentary = `${bowler.name} to ${wicketDetail ? wicketDetail.dismissedBatterName : striker.name}, ${templates[idx]}`;

  const deliveryId = `${clone.id}-inn${inn.inningsNumber}-b${clone.deliveries.length + 1}-${Date.now()}`;
  const delivery: Delivery = {
    id: deliveryId,
    inningsNumber: inn.inningsNumber,
    overNumber: currentCompletedOvers,
    ballInOver: displayBallInOver,
    overLabel,
    batterId: striker.playerId,
    batterName: wicketDetail ? wicketDetail.dismissedBatterName : striker.name,
    bowlerId: bowler.playerId,
    bowlerName: bowler.name,
    runsOffBat,
    extraRuns,
    totalRuns,
    extraType,
    isLegalDelivery,
    isBoundaryFour,
    isBoundarySix,
    isWicket,
    wicketDetail,
    eventType,
    chipLabel,
    commentary,
    timestamp: nowIso,
  };

  // Prepend to deliveries
  clone.deliveries = [delivery, ...clone.deliveries].slice(0, 60);

  // Update currentOverBalls
  const completedOverJustNow = isLegalDelivery && inn.legalBalls % 6 === 0;
  if (currentBallCountInOver === 0 && clone.currentOverBalls.length > 0 && clone.currentOverBalls.filter((b) => b.isLegalDelivery).length >= 6) {
    clone.currentOverBalls = [delivery];
  } else {
    clone.currentOverBalls = [...clone.currentOverBalls, delivery];
  }

  // Check over completion: maiden check, worm chart update, strike swap, rotate bowler
  if (completedOverJustNow) {
    const overNumberCompleted = Math.floor(inn.legalBalls / 6);
    const overRuns = clone.currentOverBalls.reduce((sum, b) => sum + b.totalRuns, 0);
    const overWickets = clone.currentOverBalls.filter((b) => b.isWicket).length;

    if (overRuns === 0) {
      bowler.maidens += 1;
    }

    const existingPoint = inn.overProgress.find((pt) => pt.over === overNumberCompleted);
    if (existingPoint) {
      existingPoint.runs = overRuns;
      existingPoint.cumulativeRuns = inn.runs;
      existingPoint.wickets = inn.wickets;
    } else {
      inn.overProgress.push({
        over: overNumberCompleted,
        runs: overRuns,
        cumulativeRuns: inn.runs,
        wickets: inn.wickets,
      });
    }

    // Rotate strike at end of over
    if (nonStriker && !striker.isOut) {
      striker.isOnStrike = false;
      nonStriker.isOnStrike = true;
    }

    // Rotate bowler to another bowler in bowlingCard (or squad bowler)
    bowler.isCurrentBowler = false;
    const nextBowlerIdx = (inn.bowlingCard.findIndex((b) => b.playerId === bowler.playerId) + 1) % inn.bowlingCard.length;
    const nextBowler = inn.bowlingCard[nextBowlerIdx] ?? bowler;
    nextBowler.isCurrentBowler = true;
    bowler = nextBowler;
  } else {
    // Update live in-progress over point for worm chart
    const liveOverNum = Math.floor(inn.legalBalls / 6) + 1;
    const liveOverRuns = clone.currentOverBalls.reduce((sum, b) => sum + b.totalRuns, 0);
    const existingLive = inn.overProgress.find((pt) => pt.over === liveOverNum);
    if (existingLive) {
      existingLive.runs = liveOverRuns;
      existingLive.cumulativeRuns = inn.runs;
      existingLive.wickets = inn.wickets;
    } else {
      inn.overProgress.push({
        over: liveOverNum,
        runs: liveOverRuns,
        cumulativeRuns: inn.runs,
        wickets: inn.wickets,
      });
    }
  }

  // Update summary fields (CRR, RRR, remaining balls, match completion)
  clone.currentRunRate = inn.runRate;
  clone.currentBatters = inn.battingCard.filter((b) => b.isAtCrease && !b.isOut);
  clone.currentBowler = bowler;

  if (inn.target && inn.maxOvers) {
    const maxBalls = inn.maxOvers * 6;
    const remainingBalls = Math.max(0, maxBalls - inn.legalBalls);
    const requiredRuns = Math.max(0, inn.target - inn.runs);
    clone.target = inn.target;
    clone.remainingBalls = remainingBalls;
    clone.requiredRuns = requiredRuns;
    clone.requiredRunRate = calculateRequiredRunRate(inn.target, inn.runs, remainingBalls);

    if (requiredRuns === 0) {
      clone.status = 'completed';
      const wktsLeft = 10 - inn.wickets;
      clone.winningTeamId = battingTeam.id;
      clone.resultMargin = `${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}`;
      clone.statusText = `${battingTeam.name} won by ${clone.resultMargin}`;
    } else if (inn.wickets >= 10 || remainingBalls === 0) {
      clone.status = 'completed';
      const runMargin = inn.target - 1 - inn.runs;
      if (runMargin === 0) {
        clone.statusText = 'Match tied';
      } else {
        clone.winningTeamId = bowlingTeam.id;
        clone.resultMargin = `${runMargin} run${runMargin === 1 ? '' : 's'}`;
        clone.statusText = `${bowlingTeam.name} won by ${clone.resultMargin}`;
      }
    } else {
      clone.statusText = `${battingTeam.shortName} need ${requiredRuns} run${requiredRuns === 1 ? '' : 's'} in ${remainingBalls} ball${remainingBalls === 1 ? '' : 's'}`;
    }
  } else if (clone.format === 'Test') {
    const firstInnOpp = clone.innings.find((i) => i.battingTeamId === bowlingTeam.id);
    const diff = inn.runs - (firstInnOpp?.runs ?? 0);
    clone.statusText =
      diff >= 0
        ? `Day 3 · ${battingTeam.shortName} lead by ${diff} runs`
        : `Day 3 · ${battingTeam.shortName} trail by ${Math.abs(diff)} runs`;
  } else {
    clone.statusText = `${battingTeam.shortName} batting · CRR ${inn.runRate.toFixed(2)}`;
  }

  // Refresh scores arrays
  clone.teamAScores = clone.innings
    .filter((i) => i.battingTeamId === clone.teamA.id)
    .map((i) => ({ label: i.label, score: `${i.runs}/${i.wickets}`, overs: i.oversDisplay }));
  clone.teamBScores = clone.innings
    .filter((i) => i.battingTeamId === clone.teamB.id)
    .map((i) => ({ label: i.label, score: `${i.runs}/${i.wickets}`, overs: i.oversDisplay }));
  clone.recentBalls = clone.deliveries.slice(0, 6).reverse().map((d) => ({
    id: d.id,
    chipLabel: d.chipLabel,
    eventType: d.eventType,
  }));
  clone.lastUpdated = nowIso;

  return { match: clone, delivery };
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
