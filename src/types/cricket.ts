export type MatchFormat = 'T20' | 'ODI' | 'Test';

export type MatchStatus = 'live' | 'upcoming' | 'completed';

export type BallEventType =
  | 'DOT'
  | 'SINGLE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'FOUR'
  | 'SIX'
  | 'WICKET'
  | 'WIDE'
  | 'NO_BALL'
  | 'BYE'
  | 'LEG_BYE';

export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | null;

export type DataMode = 'live' | 'demo';

export interface ApiStatus {
  mode: DataMode;
  provider: string;
  connected: boolean;
  rateLimited: boolean;
  lastCheckedAt: string;
  notice?: string;
}

export interface Venue {
  name: string;
  stadium?: string;
  city?: string;
  country?: string;
  capacity?: number;
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  role: 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper';
  battingStyle?: string;
  bowlingStyle?: string;
  isCaptain?: boolean;
  isWicketkeeper?: boolean;
  isSubstitute?: boolean;
  photoUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  region?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  captainId?: string;
  wicketkeeperId?: string;
  squad: Player[];
}

export interface BatterEntry {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal: string;
  isOut: boolean;
  isOnStrike?: boolean;
  isAtCrease?: boolean;
}

export interface BowlerEntry {
  playerId: string;
  name: string;
  overs: number;
  ballsBowled: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
  isCurrentBowler?: boolean;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  batterName: string;
}

export interface Partnership {
  wicketLabel: string;
  batter1Name: string;
  batter1Runs: number;
  batter1Balls: number;
  batter2Name: string;
  batter2Runs: number;
  batter2Balls: number;
  totalRuns: number;
  totalBalls: number;
  isCurrent?: boolean;
}

export interface ExtrasBreakdown {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
}

export interface OverProgressPoint {
  over: number;
  runs: number;
  cumulativeRuns: number;
  wickets: number;
}

export interface Delivery {
  id: string;
  inningsNumber: number;
  overNumber: number;
  ballInOver: number;
  overLabel: string;
  batterId: string;
  batterName: string;
  bowlerId: string;
  bowlerName: string;
  runsOffBat: number;
  extraRuns: number;
  totalRuns: number;
  extraType: ExtraType;
  isLegalDelivery: boolean;
  isBoundaryFour: boolean;
  isBoundarySix: boolean;
  isWicket: boolean;
  wicketDetail?: {
    dismissedBatterName: string;
    dismissalText: string;
    incomingBatterName?: string;
  };
  eventType: BallEventType;
  chipLabel: string;
  commentary: string;
  timestamp: string;
}

export interface Innings {
  inningsNumber: number;
  label: string;
  battingTeamId: string;
  bowlingTeamId: string;
  runs: number;
  wickets: number;
  legalBalls: number;
  oversDisplay: string;
  maxOvers: number | null; // null for Test
  runRate: number;
  target?: number;
  extras: ExtrasBreakdown;
  battingCard: BatterEntry[];
  bowlingCard: BowlerEntry[];
  didNotBat: string[];
  fallOfWickets: FallOfWicket[];
  partnerships: Partnership[];
  overProgress: OverProgressPoint[];
}

export interface MatchOfficials {
  umpires?: string[];
  thirdUmpire?: string;
  matchReferee?: string;
}

export interface MatchToss {
  winnerTeamId: string;
  winnerName: string;
  decision: 'bat' | 'bowl';
}

export interface MatchSummary {
  id: string;
  tournamentId: string;
  tournamentName: string;
  matchNumber: string;
  format: MatchFormat;
  status: MatchStatus;
  statusText: string;
  startTime: string;
  venue: Venue;
  teamA: Omit<Team, 'squad'>;
  teamB: Omit<Team, 'squad'>;
  teamAScores: { label: string; score: string; overs: string }[];
  teamBScores: { label: string; score: string; overs: string }[];
  currentInningsNumber: number;
  currentRunRate?: number;
  requiredRunRate?: number;
  target?: number;
  requiredRuns?: number;
  remainingBalls?: number;
  recentBalls: { id: string; chipLabel: string; eventType: BallEventType }[];
  winningTeamId?: string;
  resultMargin?: string;
  isFeatured?: boolean;
  dataMode: DataMode;
  lastUpdated: string;
}

export interface MatchDetail extends Omit<MatchSummary, 'teamA' | 'teamB'> {
  teamA: Team;
  teamB: Team;
  toss?: MatchToss;
  officials?: MatchOfficials;
  innings: Innings[];
  deliveries: Delivery[]; // Newest first
  currentOverBalls: Delivery[]; // Chronological within current over
  currentBatters: BatterEntry[];
  currentBowler?: BowlerEntry;
}

export interface PointsTableRow {
  position: number;
  teamId: string;
  teamName: string;
  teamShortName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  points: number;
  netRunRate: number;
  recentForm: ('W' | 'L' | 'NR')[];
}

export interface TournamentStandings {
  tournamentId: string;
  tournamentName: string;
  format: MatchFormat;
  season: string;
  qualifyCutoff: number;
  rows: PointsTableRow[];
  dataMode: DataMode;
  lastUpdated: string;
}

export interface SimulatedDeliveryInput {
  eventType?: BallEventType;
}
