import type {
  ApiStatus,
  BallEventType,
  Delivery,
  MatchDetail,
  MatchSummary,
  TournamentStandings,
} from '../../src/types/cricket';

export interface CricketDataProvider {
  readonly name: string;
  readonly mode: 'live' | 'demo';

  getStatus(): Promise<ApiStatus>;
  getMatches(): Promise<MatchSummary[]>;
  getMatchDetail(matchId: string): Promise<MatchDetail | null>;
  getMatchBalls(matchId: string): Promise<Delivery[]>;
  getAllStandings(): Promise<TournamentStandings[]>;
  getStandings(tournamentId: string): Promise<TournamentStandings | null>;
  simulateDelivery?(
    matchId: string,
    eventType?: BallEventType
  ): Promise<{ match: MatchDetail; delivery: Delivery } | null>;
  resetDemoMatch?(matchId: string): Promise<MatchDetail | null>;
}
