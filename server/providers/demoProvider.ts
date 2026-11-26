import type {
  ApiStatus,
  BallEventType,
  Delivery,
  MatchDetail,
  MatchSummary,
  TournamentStandings,
} from '../../src/types/cricket';
import { applyDeliveryToMatch, toMatchSummary } from '../../src/utils/cricketMath';
import type { CricketDataProvider } from './types';
import { createDemoStandings, createInitialDemoMatches } from './demoData';

const WEIGHTED_DELIVERY_POOL: BallEventType[] = [
  'DOT',
  'DOT',
  'DOT',
  'DOT',
  'SINGLE',
  'SINGLE',
  'SINGLE',
  'SINGLE',
  'SINGLE',
  'DOUBLE',
  'DOUBLE',
  'TRIPLE',
  'FOUR',
  'FOUR',
  'FOUR',
  'SIX',
  'WICKET',
  'WIDE',
  'NO_BALL',
  'BYE',
  'LEG_BYE',
];

export class DemoCricketProvider implements CricketDataProvider {
  readonly name = 'BOUNDARYLIVE Demo Simulator';
  readonly mode = 'demo' as const;

  private matches: Map<string, MatchDetail> = new Map();
  private standings: TournamentStandings[];
  private sequenceCounter = 0;

  constructor() {
    for (const m of createInitialDemoMatches()) {
      this.matches.set(m.id, m);
    }
    this.standings = createDemoStandings();
  }

  async getStatus(): Promise<ApiStatus> {
    return {
      mode: 'demo',
      provider: this.name,
      connected: true,
      rateLimited: false,
      lastCheckedAt: new Date().toISOString(),
      notice:
        'DEMO MODE — Displaying fictional teams and simulated live ball-by-ball updates. Configure SPORTMONKS_API_TOKEN on the server for real live cricket feeds.',
    };
  }

  async getMatches(): Promise<MatchSummary[]> {
    return Array.from(this.matches.values()).map((m) => toMatchSummary(m));
  }

  async getMatchDetail(matchId: string): Promise<MatchDetail | null> {
    return this.matches.get(matchId) ?? null;
  }

  async getMatchBalls(matchId: string): Promise<Delivery[]> {
    const match = this.matches.get(matchId);
    return match ? match.deliveries : [];
  }

  async getAllStandings(): Promise<TournamentStandings[]> {
    return this.standings;
  }

  async getStandings(tournamentId: string): Promise<TournamentStandings | null> {
    return this.standings.find((s) => s.tournamentId === tournamentId) ?? null;
  }

  async simulateDelivery(
    matchId: string,
    explicitEventType?: BallEventType
  ): Promise<{ match: MatchDetail; delivery: Delivery } | null> {
    const current = this.matches.get(matchId);
    if (!current || current.status !== 'live') {
      return null;
    }

    const chosenEvent: BallEventType =
      explicitEventType ??
      WEIGHTED_DELIVERY_POOL[this.sequenceCounter++ % WEIGHTED_DELIVERY_POOL.length];

    const result = applyDeliveryToMatch(current, chosenEvent);
    this.matches.set(matchId, result.match);
    return result;
  }

  async resetDemoMatch(matchId: string): Promise<MatchDetail | null> {
    const fresh = createInitialDemoMatches().find((m) => m.id === matchId);
    if (!fresh) return null;
    this.matches.set(matchId, fresh);
    return fresh;
  }
}
