import test from 'node:test';
import assert from 'node:assert/strict';
import {
  oversToBalls,
  ballsToOversDisplay,
  calculateRunRate,
  calculateRequiredRunRate,
  calculateStrikeRate,
  calculateEconomy,
  classifyDelivery,
  detectNewDeliveries,
  calculateNextBackoffMs,
  applyDeliveryToMatch,
} from './cricketMath';
import type { Delivery, MatchDetail } from '../types/cricket';

function makeMinimalLiveMatch(): MatchDetail {
  return {
    id: 'test-match-1',
    tournamentId: 'mpt20',
    tournamentName: 'Meridian Premier T20',
    matchNumber: 'Match 14',
    format: 'T20',
    status: 'live',
    statusText: 'MRY need 18 runs in 10 balls',
    startTime: '2026-11-22T14:00:00Z',
    venue: { name: 'Halcyon Oval', city: 'Port Meridian', country: 'Valeria' },
    teamA: {
      id: 'team-a',
      name: 'Solstice Strikers',
      shortName: 'SOL',
      primaryColor: '#E6B96A',
      secondaryColor: '#3B2F1E',
      squad: [
        { id: 'b1', name: 'Devon Mercer', shortName: 'D Mercer', role: 'Bowler' },
        { id: 'b2', name: 'Tariq Solis', shortName: 'T Solis', role: 'Bowler' },
      ],
    },
    teamB: {
      id: 'team-b',
      name: 'Meridian Royals',
      shortName: 'MRY',
      primaryColor: '#A7E66B',
      secondaryColor: '#1B3A2A',
      squad: [
        { id: 'p1', name: 'Aarav Kestrel', shortName: 'A Kestrel', role: 'Batter' },
        { id: 'p2', name: 'Liam Vance', shortName: 'L Vance', role: 'All-Rounder' },
        { id: 'p3', name: 'Nolan Reid', shortName: 'N Reid', role: 'Batter' },
      ],
    },
    teamAScores: [{ label: '1st Innings', score: '178/6', overs: '20.0' }],
    teamBScores: [{ label: '2nd Innings', score: '161/4', overs: '18.2' }],
    currentInningsNumber: 2,
    currentRunRate: 8.78,
    requiredRunRate: 10.8,
    target: 179,
    requiredRuns: 18,
    remainingBalls: 10,
    recentBalls: [],
    dataMode: 'demo',
    lastUpdated: '2026-11-22T16:30:00Z',
    innings: [
      {
        inningsNumber: 1,
        label: '1st Innings',
        battingTeamId: 'team-a',
        bowlingTeamId: 'team-b',
        runs: 178,
        wickets: 6,
        legalBalls: 120,
        oversDisplay: '20.0',
        maxOvers: 20,
        runRate: 8.9,
        extras: { wides: 4, noBalls: 1, byes: 0, legByes: 2, penalty: 0, total: 7 },
        battingCard: [],
        bowlingCard: [],
        didNotBat: [],
        fallOfWickets: [],
        partnerships: [],
        overProgress: [],
      },
      {
        inningsNumber: 2,
        label: '2nd Innings',
        battingTeamId: 'team-b',
        bowlingTeamId: 'team-a',
        runs: 161,
        wickets: 4,
        legalBalls: 110, // 18.2 overs
        oversDisplay: '18.2',
        maxOvers: 20,
        runRate: 8.78,
        target: 179,
        extras: { wides: 3, noBalls: 0, byes: 1, legByes: 2, penalty: 0, total: 6 },
        battingCard: [
          {
            playerId: 'p1',
            name: 'Aarav Kestrel',
            runs: 64,
            balls: 40,
            fours: 6,
            sixes: 2,
            strikeRate: 160,
            dismissal: 'not out',
            isOut: false,
            isAtCrease: true,
            isOnStrike: true,
          },
          {
            playerId: 'p2',
            name: 'Liam Vance',
            runs: 22,
            balls: 15,
            fours: 2,
            sixes: 0,
            strikeRate: 146.67,
            dismissal: 'not out',
            isOut: false,
            isAtCrease: true,
            isOnStrike: false,
          },
        ],
        bowlingCard: [
          {
            playerId: 'b1',
            name: 'Devon Mercer',
            overs: 3.2,
            ballsBowled: 20,
            maidens: 0,
            runs: 28,
            wickets: 2,
            economy: 8.4,
            wides: 1,
            noBalls: 0,
            isCurrentBowler: true,
          },
          {
            playerId: 'b2',
            name: 'Tariq Solis',
            overs: 3.0,
            ballsBowled: 18,
            maidens: 0,
            runs: 24,
            wickets: 1,
            economy: 8.0,
            wides: 0,
            noBalls: 0,
            isCurrentBowler: false,
          },
        ],
        didNotBat: ['Nolan Reid'],
        fallOfWickets: [],
        partnerships: [
          {
            wicketLabel: '5th wicket',
            batter1Name: 'Aarav Kestrel',
            batter1Runs: 30,
            batter1Balls: 20,
            batter2Name: 'Liam Vance',
            batter2Runs: 22,
            batter2Balls: 15,
            totalRuns: 52,
            totalBalls: 35,
            isCurrent: true,
          },
        ],
        overProgress: [{ over: 18, runs: 11, cumulativeRuns: 158, wickets: 4 }],
      },
    ],
    deliveries: [],
    currentOverBalls: [],
    currentBatters: [],
  };
}

test('overs and balls conversion handles cricket base-6 notation', () => {
  assert.equal(oversToBalls(18.2), 110);
  assert.equal(oversToBalls(20.0), 120);
  assert.equal(ballsToOversDisplay(110), '18.2');
  assert.equal(ballsToOversDisplay(114), '19.0');
  assert.equal(ballsToOversDisplay(0), '0.0');
});

test('run rate, required run rate, strike rate, and economy compute accurately', () => {
  assert.equal(calculateRunRate(178, 120), 8.9);
  assert.equal(calculateRequiredRunRate(179, 161, 10), 10.8);
  assert.equal(calculateStrikeRate(64, 40), 160);
  assert.equal(calculateEconomy(28, 20), 8.4);
  assert.equal(calculateStrikeRate(0, 0), 0);
});

test('classifyDelivery distinguishes all 11 delivery outcomes accurately', () => {
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 0, extraRuns: 0, extraType: null, isWicket: false }),
    { eventType: 'DOT', chipLabel: '0' }
  );
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 1, extraRuns: 0, extraType: null, isWicket: false }),
    { eventType: 'SINGLE', chipLabel: '1' }
  );
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 4, extraRuns: 0, extraType: null, isWicket: false, isBoundaryFour: true }),
    { eventType: 'FOUR', chipLabel: '4' }
  );
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 6, extraRuns: 0, extraType: null, isWicket: false, isBoundarySix: true }),
    { eventType: 'SIX', chipLabel: '6' }
  );
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 0, extraRuns: 0, extraType: null, isWicket: true }),
    { eventType: 'WICKET', chipLabel: 'W' }
  );
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 0, extraRuns: 1, extraType: 'wide', isWicket: false }),
    { eventType: 'WIDE', chipLabel: 'WD' }
  );
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 0, extraRuns: 1, extraType: 'noball', isWicket: false }),
    { eventType: 'NO_BALL', chipLabel: 'NB' }
  );
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 0, extraRuns: 2, extraType: 'bye', isWicket: false }),
    { eventType: 'BYE', chipLabel: '2B' }
  );
  assert.deepEqual(
    classifyDelivery({ runsOffBat: 0, extraRuns: 1, extraType: 'legbye', isWicket: false }),
    { eventType: 'LEG_BYE', chipLabel: '1LB' }
  );
});

test('detectNewDeliveries prevents replaying old balls on hydration and deduplicates', () => {
  const sample = (id: string): Delivery => ({
    id,
    inningsNumber: 2,
    overNumber: 18,
    ballInOver: 1,
    overLabel: '18.1',
    batterId: 'p1',
    batterName: 'Aarav Kestrel',
    bowlerId: 'b1',
    bowlerName: 'Devon Mercer',
    runsOffBat: 1,
    extraRuns: 0,
    totalRuns: 1,
    extraType: null,
    isLegalDelivery: true,
    isBoundaryFour: false,
    isBoundarySix: false,
    isWicket: false,
    eventType: 'SINGLE',
    chipLabel: '1',
    commentary: 'Single',
    timestamp: '2026-11-22T16:30:00Z',
  });

  const existing = [sample('d2'), sample('d1')];
  assert.equal(detectNewDeliveries(new Set(), existing, false).length, 0);

  const seen = new Set(['d1', 'd2']);
  const incoming = [sample('d4'), sample('d3'), sample('d2'), sample('d1')];
  const fresh = detectNewDeliveries(seen, incoming, true);
  assert.deepEqual(
    fresh.map((d) => d.id),
    ['d3', 'd4']
  );
});

test('calculateNextBackoffMs doubles with cap', () => {
  assert.equal(calculateNextBackoffMs(0, 15000, 120000), 15000);
  assert.equal(calculateNextBackoffMs(1, 15000, 120000), 30000);
  assert.equal(calculateNextBackoffMs(2, 15000, 120000), 60000);
  assert.equal(calculateNextBackoffMs(5, 15000, 120000), 120000);
});

test('applyDeliveryToMatch updates score, strike rotation, extras, and wicket replacement', () => {
  const base = makeMinimalLiveMatch();

  // 1. SIX increases runs by 6, balls by 1, sixes by 1, striker unchanged
  const afterSix = applyDeliveryToMatch(base, 'SIX');
  const innSix = afterSix.match.innings[1];
  assert.equal(innSix.runs, 167);
  assert.equal(innSix.legalBalls, 111);
  assert.equal(innSix.oversDisplay, '18.3');
  assert.equal(innSix.battingCard[0].runs, 70);
  assert.equal(innSix.battingCard[0].sixes, 3);
  assert.equal(innSix.battingCard[0].isOnStrike, true);

  // 2. SINGLE rotates strike
  const afterSingle = applyDeliveryToMatch(afterSix.match, 'SINGLE');
  const innSingle = afterSingle.match.innings[1];
  assert.equal(innSingle.runs, 168);
  assert.equal(innSingle.battingCard[0].isOnStrike, false);
  assert.equal(innSingle.battingCard[1].isOnStrike, true);

  // 3. WIDE adds extra run without incrementing legalBalls
  const afterWide = applyDeliveryToMatch(afterSingle.match, 'WIDE');
  const innWide = afterWide.match.innings[1];
  assert.equal(innWide.runs, 169);
  assert.equal(innWide.legalBalls, 112); // unchanged
  assert.equal(innWide.extras.wides, 4);

  // 4. WICKET dismisses striker and brings in Nolan Reid from didNotBat
  const afterWicket = applyDeliveryToMatch(afterWide.match, 'WICKET');
  const innWkt = afterWicket.match.innings[1];
  assert.equal(innWkt.wickets, 5);
  assert.equal(innWkt.fallOfWickets.length, 1);
  assert.equal(innWkt.battingCard[1].isOut, true);
  assert.equal(innWkt.battingCard[2].name, 'Nolan Reid');
  assert.equal(innWkt.battingCard[2].isOnStrike, true);
  assert.equal(afterWicket.delivery.wicketDetail?.incomingBatterName, 'Nolan Reid');
});
