import type {
  ApiStatus,
  BatterEntry,
  BowlerEntry,
  Delivery,
  ExtrasBreakdown,
  FallOfWicket,
  Innings,
  MatchDetail,
  MatchFormat,
  MatchOfficials,
  MatchStatus,
  MatchSummary,
  OverProgressPoint,
  Player,
  PointsTableRow,
  Team,
  TournamentStandings,
} from '../../src/types/cricket';
import {
  ballsToOversDisplay,
  calculateEconomy,
  calculateRequiredRunRate,
  calculateRunRate,
  calculateStrikeRate,
  classifyDelivery,
  oversToBalls,
  toMatchSummary,
} from '../../src/utils/cricketMath';
import type { CricketDataProvider } from './types';

const ALLOWED_BASE_URL = 'https://cricket.sportmonks.com/api/v2.0';
const CACHE_TTL_MS = 15_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

function sanitizeHttpsUrl(url: unknown): string | undefined {
  if (typeof url !== 'string' || !url.trim()) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function mapFormat(typeRaw: unknown): MatchFormat {
  const s = String(typeRaw ?? '').toUpperCase();
  if (s.includes('TEST') || s.includes('4DAY') || s.includes('FIRST') || s.includes('RED')) {
    return 'Test';
  }
  if (s.includes('ODI') || s.includes('LIST A') || s.includes('50') || s.includes('ONE DAY')) {
    return 'ODI';
  }
  return 'T20';
}

function mapStatus(statusRaw: unknown, fromLivescores: boolean): MatchStatus {
  const s = String(statusRaw ?? '').trim().toUpperCase();
  if (
    s === 'NS' ||
    s === 'POSTP.' ||
    s === 'DELAYED' ||
    s === 'TBA' ||
    s === 'SCHEDULED'
  ) {
    return 'upcoming';
  }
  if (
    s === 'FINISHED' ||
    s === 'FT' ||
    s === 'ABAN.' ||
    s === 'ABANDONED' ||
    s === 'CANCL.' ||
    s === 'CANCELLED'
  ) {
    return 'completed';
  }
  if (
    fromLivescores ||
    s.includes('INNINGS') ||
    s.includes('BREAK') ||
    s.includes('STUMPS') ||
    s.includes('LUNCH') ||
    s.includes('TEA') ||
    s.includes('DINNER') ||
    s.includes('INT.') ||
    s.includes('SUPER OVER') ||
    s === 'LIVE'
  ) {
    return 'live';
  }
  return 'upcoming';
}

function formatReadableStatusText(
  rawStatus: string,
  rawNote: string,
  status: MatchStatus,
  startIso: string
): string {
  if (rawNote && rawNote.trim().length > 0) {
    return rawNote.trim();
  }
  if (status === 'upcoming') {
    const dt = new Date(startIso);
    if (!Number.isNaN(dt.getTime())) {
      const formatted = dt.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
      return `Starts ${formatted} UTC`;
    }
    return 'Scheduled';
  }
  if (rawStatus === 'NS') return 'Scheduled';
  return rawStatus || (status === 'live' ? 'In Play' : 'Completed');
}

function mapRole(positionName: unknown): Player['role'] {
  const s = String(positionName ?? '').toLowerCase();
  if (s.includes('wicket')) return 'Wicketkeeper';
  if (s.includes('all')) return 'All-Rounder';
  if (s.includes('bowl')) return 'Bowler';
  return 'Batter';
}

function parseScoreboardInningsNumber(scoreboard: unknown, fallback: number): number {
  const s = String(scoreboard ?? '').toUpperCase();
  const m = s.match(/S(\d+)/);
  if (m) return Number(m[1]);
  const digits = s.replace(/\D/g, '');
  return digits ? Number(digits) : fallback;
}

function teamPalette(seed: string): { primary: string; secondary: string } {
  const palettes = [
    { primary: '#A7E66B', secondary: '#193524' },
    { primary: '#E6B96A', secondary: '#362A17' },
    { primary: '#75B8A0', secondary: '#162C27' },
    { primary: '#7EA8E6', secondary: '#1A273D' },
    { primary: '#C59CE6', secondary: '#2A1D38' },
    { primary: '#E88D79', secondary: '#361E1A' },
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palettes[hash % palettes.length];
}

function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export class SportmonksCricketProvider implements CricketDataProvider {
  readonly name = 'Sportmonks Cricket API v2.0';
  readonly mode = 'live' as const;

  private readonly token: string;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private lastRateLimited = false;
  private lastErrorNotice: string | undefined;
  private lastConnected = true;
  private apiServerDate: Date | null = null;
  private knownSeasonIds: Set<string> = new Set();

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    params: Record<string, string> = {},
    ttlMs = CACHE_TTL_MS
  ): Promise<{ data: T | null; status: number }> {
    const cacheKey = `${path}?${new URLSearchParams(params).toString()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { data: cached.value as T, status: 200 };
    }

    const url = new URL(`${ALLOWED_BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    url.searchParams.set('api_token', this.token);

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12_000),
      });

      const dateHeader = res.headers.get('date');
      if (dateHeader) {
        const parsedDate = new Date(dateHeader);
        if (!Number.isNaN(parsedDate.getTime())) {
          this.apiServerDate = parsedDate;
        }
      }

      if (res.status === 429) {
        this.lastRateLimited = true;
        this.lastErrorNotice = 'Sportmonks API rate limit reached. Retaining last known match state.';
        return { data: null, status: 429 };
      }

      if (res.status === 401 || res.status === 403) {
        this.lastConnected = false;
        this.lastErrorNotice =
          'Sportmonks API authentication or plan permission error. Verify token and included leagues.';
        return { data: null, status: res.status };
      }

      if (!res.ok) {
        return { data: null, status: res.status };
      }

      const json = (await res.json()) as { data?: T };
      this.lastConnected = true;
      this.lastRateLimited = false;
      this.lastErrorNotice = undefined;

      const data = (json?.data ?? null) as T | null;
      if (data !== null) {
        this.cache.set(cacheKey, { value: data, expiresAt: Date.now() + ttlMs });
      }
      return { data, status: 200 };
    } catch {
      this.lastConnected = false;
      this.lastErrorNotice =
        'Unable to reach Sportmonks Cricket API. Retrying automatically with backoff.';
      return { data: null, status: 0 };
    }
  }

  async getStatus(): Promise<ApiStatus> {
    return {
      mode: 'live',
      provider: this.name,
      connected: this.lastConnected,
      rateLimited: this.lastRateLimited,
      lastCheckedAt: new Date().toISOString(),
      notice: this.lastErrorNotice,
    };
  }

  async getMatches(): Promise<MatchSummary[]> {
    // 1. Fetch livescores first (also captures real Sportmonks UTC server date)
    const liveRes = await this.request<Record<string, unknown>[]>('/livescores', {
      include: 'localteam,visitorteam,runs,league,venue,season',
    });

    const referenceNow = this.apiServerDate ?? new Date();
    const pastWindowStart = new Date(referenceNow.getTime() - 21 * 24 * 3600_000);
    const futureWindowEnd = new Date(referenceNow.getTime() + 30 * 24 * 3600_000);
    const startsBetween = `${formatYmd(pastWindowStart)},${formatYmd(futureWindowEnd)}`;

    // 2. Fetch current/recent/upcoming fixtures around real today
    let fixturesRes = await this.request<Record<string, unknown>[]>(
      '/fixtures',
      {
        'filter[starts_between]': startsBetween,
        include: 'localteam,visitorteam,runs,league,venue,season',
        sort: '-starting_at',
      },
      30_000
    );

    // Fallback if window returns empty (e.g. off-season or limited league subscription)
    if (!fixturesRes.data || fixturesRes.data.length === 0) {
      fixturesRes = await this.request<Record<string, unknown>[]>(
        '/fixtures',
        {
          include: 'localteam,visitorteam,runs,league,venue,season',
          sort: '-starting_at',
        },
        30_000
      );
    }

    const merged = new Map<string, MatchDetail>();

    for (const item of liveRes.data ?? []) {
      const mapped = this.mapFixtureToDetail(item, true);
      if (mapped) {
        if (item.season_id) this.knownSeasonIds.add(String(item.season_id));
        merged.set(mapped.id, mapped);
      }
    }

    for (const item of (fixturesRes.data ?? []).slice(0, 40)) {
      const id = String(item.id ?? '');
      if (!id || merged.has(id)) continue;
      const mapped = this.mapFixtureToDetail(item, false);
      if (mapped) {
        if (item.season_id) this.knownSeasonIds.add(String(item.season_id));
        merged.set(mapped.id, mapped);
      }
    }

    // Sort: Live first, then upcoming (soonest first), then completed (most recent first)
    const allSummaries = Array.from(merged.values()).map((d) => toMatchSummary(d));
    const liveList = allSummaries.filter((m) => m.status === 'live');
    const upcomingList = allSummaries
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const completedList = allSummaries
      .filter((m) => m.status === 'completed')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const ordered = [...liveList, ...completedList.slice(0, 12), ...upcomingList.slice(0, 12)];

    if (liveList[0]) {
      liveList[0].isFeatured = true;
    } else if (completedList[0]) {
      completedList[0].isFeatured = true;
    } else if (ordered[0]) {
      ordered[0].isFeatured = true;
    }

    return ordered;
  }

  async getMatchDetail(matchId: string): Promise<MatchDetail | null> {
    if (!/^[0-9]{1,12}$/.test(matchId)) return null;

    // Try rich nested includes first (batsman, result, bowler, catchstump, officials, scoreboards, balls)
    let res = await this.request<Record<string, unknown>>(`/fixtures/${matchId}`, {
      include:
        'localteam,visitorteam,runs,scoreboards,batting.batsman,batting.result,batting.bowler,batting.catchstump,batting.runoutby,bowling.bowler,lineup,balls.batsman,balls.bowler,balls.score,venue,league,season,tosswon,firstumpire,secondumpire,tvumpire,referee',
    });

    // Fallback to core includes if subscription restricts certain nested resources
    if (!res.data) {
      res = await this.request<Record<string, unknown>>(`/fixtures/${matchId}`, {
        include: 'localteam,visitorteam,runs,scoreboards,batting,bowling,lineup,balls,venue,league,tosswon',
      });
    }

    if (!res.data) return null;
    if (res.data.season_id) this.knownSeasonIds.add(String(res.data.season_id));
    return this.mapFixtureToDetail(res.data, false);
  }

  async getMatchBalls(matchId: string): Promise<Delivery[]> {
    const detail = await this.getMatchDetail(matchId);
    return detail ? detail.deliveries : [];
  }

  async getAllStandings(): Promise<TournamentStandings[]> {
    // Ensure we have season IDs discovered from current matches
    if (this.knownSeasonIds.size === 0) {
      await this.getMatches();
    }

    const candidateSeasonIds = new Set<string>(this.knownSeasonIds);

    // Also pull recent seasons sorted descending by id
    const seasonsRes = await this.request<Record<string, unknown>[]>(
      '/seasons',
      { sort: '-id' },
      120_000
    );
    for (const s of (seasonsRes.data ?? []).slice(0, 12)) {
      if (s.id) candidateSeasonIds.add(String(s.id));
    }

    const results: TournamentStandings[] = [];
    const seenTournaments = new Set<string>();

    for (const seasonId of Array.from(candidateSeasonIds).slice(0, 12)) {
      if (results.length >= 4) break;
      const standing = await this.getStandings(seasonId);
      if (standing && standing.rows.length > 0 && !seenTournaments.has(standing.tournamentName)) {
        seenTournaments.add(standing.tournamentName);
        results.push(standing);
      }
    }

    return results;
  }

  async getStandings(seasonId: string): Promise<TournamentStandings | null> {
    if (!/^[0-9]{1,12}$/.test(seasonId)) return null;

    // Sportmonks v2.0 uses singular `/standings/season/{season_id}`
    const res = await this.request<Record<string, unknown>[]>(
      `/standings/season/${seasonId}`,
      { include: 'team,league,season,stage' },
      60_000
    );

    const raw = res.data;
    if (!raw || !Array.isArray(raw) || raw.length === 0) return null;

    // Group rows by stage_id so multi-group tournaments don't interleave duplicate rank #1 rows
    const byStage = new Map<string, Record<string, unknown>[]>();
    for (const r of raw) {
      const sid = String(r.stage_id ?? 'default');
      const arr = byStage.get(sid) ?? [];
      arr.push(r);
      byStage.set(sid, arr);
    }

    // Pick the primary stage with highest total matches played (or largest table)
    const primaryGroup =
      Array.from(byStage.values()).sort((a, b) => {
        const playedA = a.reduce((sum, r) => sum + Number(r.played ?? 0), 0);
        const playedB = b.reduce((sum, r) => sum + Number(r.played ?? 0), 0);
        if (playedB !== playedA) return playedB - playedA;
        return b.length - a.length;
      })[0] ?? raw;

    const first = primaryGroup[0];
    const league = (first.league as Record<string, unknown> | undefined) ?? {};
    const season = (first.season as Record<string, unknown> | undefined) ?? {};
    const stage = (first.stage as Record<string, unknown> | undefined) ?? {};

    const seenTeamIds = new Set<string>();
    const rows: PointsTableRow[] = primaryGroup
      .slice()
      .sort((a, b) => Number(a.position ?? 99) - Number(b.position ?? 99))
      .filter((row) => {
        const tid = String((row.team as Record<string, unknown> | undefined)?.id ?? row.team_id ?? '');
        if (!tid || seenTeamIds.has(tid)) return false;
        seenTeamIds.add(tid);
        return true;
      })
      .map((row, idx) => {
        const team = (row.team as Record<string, unknown> | undefined) ?? {};
        const name = String(team.name ?? `Team ${idx + 1}`);
        const shortName = String(team.code ?? name.slice(0, 3).toUpperCase());
        const palette = teamPalette(shortName);

        const formArr = Array.isArray(row.recent_form)
          ? (row.recent_form as unknown[]).map((f) => String(f).toUpperCase())
          : String(row.recent_form ?? '')
              .toUpperCase()
              .split('')
              .filter((c) => c === 'W' || c === 'L' || c === 'N');

        const recentForm: ('W' | 'L' | 'NR')[] = formArr.slice(-5).map((c) =>
          c === 'W' ? 'W' : c === 'L' ? 'L' : 'NR'
        );

        return {
          position: idx + 1,
          teamId: String(team.id ?? row.team_id ?? idx),
          teamName: name,
          teamShortName: shortName,
          primaryColor: palette.primary,
          secondaryColor: palette.secondary,
          logoUrl: sanitizeHttpsUrl(team.image_path),
          played: Number(row.played ?? 0),
          won: Number(row.won ?? 0),
          lost: Number(row.lost ?? 0),
          noResult: Number(row.noresult ?? row.draw ?? 0),
          points: Number(row.points ?? 0),
          netRunRate: Number(row.netto_run_rate ?? 0),
          recentForm,
        };
      });

    const stageName = typeof stage.name === 'string' && stage.name.trim() ? stage.name.trim() : '';
    const leagueName = typeof league.name === 'string' && league.name.trim() ? league.name.trim() : '';
    const tournamentName =
      leagueName && stageName && !stageName.toLowerCase().includes(leagueName.toLowerCase()) && byStage.size > 1
        ? `${leagueName} · ${stageName}`
        : leagueName || stageName || `Tournament Season ${seasonId}`;

    return {
      tournamentId: seasonId,
      tournamentName,
      format: mapFormat(league.type ?? stage.type),
      season: String(season.name ?? ''),
      qualifyCutoff: Math.min(4, Math.max(2, Math.floor(rows.length / 2))),
      rows,
      dataMode: 'live',
      lastUpdated: new Date().toISOString(),
    };
  }

  private mapFixtureToDetail(
    raw: Record<string, unknown>,
    fromLivescores: boolean
  ): MatchDetail | null {
    const id = String(raw.id ?? '');
    if (!id) return null;

    const localRaw = (raw.localteam as Record<string, unknown> | undefined) ?? {};
    const visitorRaw = (raw.visitorteam as Record<string, unknown> | undefined) ?? {};
    const leagueRaw = (raw.league as Record<string, unknown> | undefined) ?? {};
    const venueRaw = (raw.venue as Record<string, unknown> | undefined) ?? {};
    const lineupRaw = Array.isArray(raw.lineup) ? (raw.lineup as Record<string, unknown>[]) : [];
    const runsRaw = Array.isArray(raw.runs) ? (raw.runs as Record<string, unknown>[]) : [];
    const scoreboardsRaw = Array.isArray(raw.scoreboards)
      ? (raw.scoreboards as Record<string, unknown>[])
      : [];
    const battingRaw = Array.isArray(raw.batting) ? (raw.batting as Record<string, unknown>[]) : [];
    const bowlingRaw = Array.isArray(raw.bowling) ? (raw.bowling as Record<string, unknown>[]) : [];
    const ballsRaw = Array.isArray(raw.balls) ? (raw.balls as Record<string, unknown>[]) : [];

    const localId = String(localRaw.id ?? raw.localteam_id ?? 'local');
    const visitorId = String(visitorRaw.id ?? raw.visitorteam_id ?? 'visitor');
    const localCode = String(
      localRaw.code ?? String(localRaw.name ?? 'HOM').slice(0, 3).toUpperCase()
    );
    const visitorCode = String(
      visitorRaw.code ?? String(visitorRaw.name ?? 'AWY').slice(0, 3).toUpperCase()
    );
    const localPal = teamPalette(localCode);
    const visitorPal = teamPalette(visitorCode);

    const mapSquad = (teamId: string): Player[] =>
      lineupRaw
        .filter((p) => {
          const line = p.lineup as Record<string, unknown> | undefined;
          return String(line?.team_id ?? '') === teamId;
        })
        .map((p) => {
          const line = p.lineup as Record<string, unknown> | undefined;
          const pos = p.position as Record<string, unknown> | undefined;
          const fullName = String(
            p.fullname ?? `${p.firstname ?? ''} ${p.lastname ?? ''}`
          ).trim();
          return {
            id: String(p.id ?? fullName),
            name: fullName || 'Player',
            shortName: String(p.lastname ?? fullName),
            role: mapRole(pos?.name),
            battingStyle: typeof p.battingstyle === 'string' && p.battingstyle ? p.battingstyle : undefined,
            bowlingStyle: typeof p.bowlingstyle === 'string' && p.bowlingstyle ? p.bowlingstyle : undefined,
            isCaptain: Boolean(line?.captain),
            isWicketkeeper: Boolean(line?.wicketkeeper),
            isSubstitute: Boolean(line?.substitution),
            photoUrl: sanitizeHttpsUrl(p.image_path),
          };
        });

    const teamA: Team = {
      id: localId,
      name: String(localRaw.name ?? 'Home Team'),
      shortName: localCode,
      primaryColor: localPal.primary,
      secondaryColor: localPal.secondary,
      logoUrl: sanitizeHttpsUrl(localRaw.image_path),
      squad: mapSquad(localId),
    };

    const teamB: Team = {
      id: visitorId,
      name: String(visitorRaw.name ?? 'Visitor Team'),
      shortName: visitorCode,
      primaryColor: visitorPal.primary,
      secondaryColor: visitorPal.secondary,
      logoUrl: sanitizeHttpsUrl(visitorRaw.image_path),
      squad: mapSquad(visitorId),
    };

    const playerNameById = new Map<string, string>();
    for (const p of [...teamA.squad, ...teamB.squad]) {
      playerNameById.set(p.id, p.name);
    }

    // Collect extra player names embedded inside batting/bowling/balls nested includes
    const registerNestedPlayer = (obj: unknown) => {
      if (!obj || typeof obj !== 'object') return;
      const rec = obj as Record<string, unknown>;
      if (rec.id && (rec.fullname || rec.lastname)) {
        playerNameById.set(
          String(rec.id),
          String(rec.fullname ?? `${rec.firstname ?? ''} ${rec.lastname ?? ''}`).trim()
        );
      }
    };

    for (const b of battingRaw) {
      registerNestedPlayer(b.batsman);
      registerNestedPlayer(b.bowler);
      registerNestedPlayer(b.catchstump);
      registerNestedPlayer(b.runoutby);
    }
    for (const bw of bowlingRaw) {
      registerNestedPlayer(bw.bowler);
    }
    for (const bl of ballsRaw) {
      registerNestedPlayer(bl.batsman);
      registerNestedPlayer(bl.bowler);
    }

    const format = mapFormat(raw.type ?? leagueRaw.type);
    const maxOvers = format === 'T20' ? 20 : format === 'ODI' ? 50 : null;
    const rawStatusStr = String(raw.status ?? '');
    const rawNoteStr = String(raw.note ?? '');
    const startTime = String(raw.starting_at ?? new Date().toISOString());
    const status = mapStatus(rawStatusStr, fromLivescores);
    const statusText = formatReadableStatusText(rawStatusStr, rawNoteStr, status, startTime);

    // Map balls chronologically first so we can build overProgress & currentOverBalls
    const allDeliveriesChrono: Delivery[] = ballsRaw.map((ball, idx) => {
      const scoreObj = (ball.score as Record<string, unknown> | undefined) ?? {};
      const scoreName = String(scoreObj.name ?? '').trim();
      const scoreLower = scoreName.toLowerCase();
      const isWicket = Boolean(scoreObj.is_wicket || scoreObj.out);
      const isFour = Boolean(scoreObj.four);
      const isSix = Boolean(scoreObj.six);

      const extraType = scoreLower.includes('wide')
        ? 'wide'
        : scoreLower.includes('no ball')
          ? 'noball'
          : scoreLower.includes('leg bye')
            ? 'legbye'
            : scoreLower.includes('bye')
              ? 'bye'
              : null;

      const rawRuns = Number(scoreObj.runs ?? 0);
      const runsOffBat = extraType ? (extraType === 'noball' ? Math.max(0, rawRuns - 1) : 0) : rawRuns;
      const extraRuns = extraType ? (extraType === 'noball' ? 1 : Math.max(1, rawRuns)) : 0;

      const { eventType, chipLabel } = classifyDelivery({
        runsOffBat,
        extraRuns,
        extraType,
        isWicket,
        isBoundaryFour: isFour,
        isBoundarySix: isSix,
      });

      const ballFloat = Number(ball.ball ?? 0);
      const ballStr = Number.isFinite(ballFloat) ? ballFloat.toFixed(1) : String(ball.ball ?? '0.0');
      const [ovStr, bStr] = ballStr.split('.');
      const batterId = String(ball.batsman_id ?? '');
      const bowlerId = String(ball.bowler_id ?? '');
      const batterName = playerNameById.get(batterId) ?? 'Batter';
      const bowlerName = playerNameById.get(bowlerId) ?? 'Bowler';
      const innNum = parseScoreboardInningsNumber(ball.scoreboard, 1);

      return {
        id: String(ball.id ?? `sm-ball-${idx}`),
        inningsNumber: innNum,
        overNumber: Number(ovStr ?? 0),
        ballInOver: Number(bStr ?? 0),
        overLabel: ballStr,
        batterId,
        batterName,
        bowlerId,
        bowlerName,
        runsOffBat,
        extraRuns,
        totalRuns: rawRuns,
        extraType,
        isLegalDelivery: extraType !== 'wide' && extraType !== 'noball',
        isBoundaryFour: isFour,
        isBoundarySix: isSix,
        isWicket,
        wicketDetail: isWicket
          ? {
              dismissedBatterName: batterName,
              dismissalText: scoreName || 'Wicket',
            }
          : undefined,
        eventType,
        chipLabel,
        commentary: `${bowlerName} to ${batterName} — ${scoreName || `${rawRuns} run${rawRuns === 1 ? '' : 's'}`}.`,
        timestamp: String(ball.updated_at ?? startTime),
      };
    });

    // Build innings list from `runs` (sorted by inning number)
    const sortedRuns = runsRaw
      .slice()
      .sort((a, b) => Number(a.inning ?? 0) - Number(b.inning ?? 0));

    const innings: Innings[] = sortedRuns.map((r, idx) => {
      const innNum = Number(r.inning ?? idx + 1);
      const battingTeamId = String(r.team_id ?? (idx % 2 === 0 ? localId : visitorId));
      const bowlingTeamId = battingTeamId === localId ? visitorId : localId;
      const runs = Number(r.score ?? 0);
      const wickets = Number(r.wickets ?? 0);
      const oversFloat = Number(r.overs ?? 0);
      const legalBalls = oversToBalls(oversFloat);

      // Extras from Sportmonks `scoreboards` where type === 'extra'
      const extraBoard = scoreboardsRaw.find(
        (sb) =>
          String(sb.type ?? '').toLowerCase() === 'extra' &&
          parseScoreboardInningsNumber(sb.scoreboard, innNum) === innNum
      );

      const extras: ExtrasBreakdown = {
        wides: Number(extraBoard?.wide ?? 0),
        noBalls: Number(extraBoard?.noball_runs ?? extraBoard?.noball_balls ?? 0),
        byes: Number(extraBoard?.bye ?? 0),
        legByes: Number(extraBoard?.leg_bye ?? 0),
        penalty: Number(extraBoard?.penalty ?? 0),
        total: 0,
      };
      extras.total =
        extras.wides + extras.noBalls + extras.byes + extras.legByes + extras.penalty;

      const innBattingRaw = battingRaw
        .filter(
          (b) =>
            String(b.team_id ?? '') === battingTeamId &&
            parseScoreboardInningsNumber(b.scoreboard, innNum) === innNum
        )
        .sort((a, b) => Number(a.sort ?? 99) - Number(b.sort ?? 99));

      const battingCard: BatterEntry[] = innBattingRaw.map((b) => {
        const pid = String(b.player_id ?? '');
        const bRuns = Number(b.score ?? 0);
        const bBalls = Number(b.ball ?? 0);
        const resultObj = b.result as Record<string, unknown> | undefined;
        const resultName = String(resultObj?.name ?? '').trim();
        const isNotOutResult =
          resultName.toLowerCase() === 'not out' ||
          (!b.bowling_player_id && !b.catch_stump_player_id && !b.runout_by_id && !b.fow_score && resultName === '');
        const isOut =
          Boolean(resultObj?.out) ||
          Boolean(b.fow_score && Number(b.fow_score) > 0) ||
          (resultName.length > 0 && !isNotOutResult);

        const bowlerName = b.bowling_player_id
          ? playerNameById.get(String(b.bowling_player_id))
          : undefined;
        const catcherName = b.catch_stump_player_id
          ? playerNameById.get(String(b.catch_stump_player_id))
          : undefined;
        const runoutName = b.runout_by_id
          ? playerNameById.get(String(b.runout_by_id))
          : undefined;

        let dismissal = 'not out';
        if (isOut) {
          if (catcherName && bowlerName) {
            dismissal = resultName.toLowerCase().includes('stump')
              ? `st ${catcherName} b ${bowlerName}`
              : `c ${catcherName} b ${bowlerName}`;
          } else if (runoutName) {
            dismissal = `run out (${runoutName})`;
          } else if (resultName.toLowerCase().includes('lbw') && bowlerName) {
            dismissal = `lbw b ${bowlerName}`;
          } else if (bowlerName) {
            dismissal = `b ${bowlerName}`;
          } else if (resultName) {
            dismissal = resultName;
          } else {
            dismissal = 'out';
          }
        }

        return {
          playerId: pid,
          name: playerNameById.get(pid) ?? `Player #${pid}`,
          runs: bRuns,
          balls: bBalls,
          fours: Number(b.four_x ?? 0),
          sixes: Number(b.six_x ?? 0),
          strikeRate: Number(b.rate ?? calculateStrikeRate(bRuns, bBalls)),
          dismissal,
          isOut,
          isAtCrease: Boolean(b.active) || (!isOut && status === 'live'),
          isOnStrike: false,
        };
      });

      // Mark striker from latest ball in this innings
      const innBalls = allDeliveriesChrono.filter((d) => d.inningsNumber === innNum);
      const lastBallInInn = innBalls[innBalls.length - 1];
      const activeCrease = battingCard.filter((b) => !b.isOut);
      if (lastBallInInn) {
        const strikerEntry = activeCrease.find((b) => b.playerId === lastBallInInn.batterId);
        if (strikerEntry) strikerEntry.isOnStrike = true;
        else if (activeCrease[0]) activeCrease[0].isOnStrike = true;
      } else if (activeCrease[0]) {
        activeCrease[0].isOnStrike = true;
      }

      // Fall of wickets derived from Sportmonks `fow_score` / `fow_balls`
      const fallOfWickets: FallOfWicket[] = innBattingRaw
        .filter((b) => Number(b.fow_score ?? 0) > 0 || Number(b.fow_balls ?? 0) > 0)
        .sort((a, b) => Number(a.fow_balls ?? 0) - Number(b.fow_balls ?? 0))
        .map((b, fowIdx) => ({
          wicketNumber: fowIdx + 1,
          score: Number(b.fow_score ?? 0),
          overs: String(b.fow_balls ?? ''),
          batterName: playerNameById.get(String(b.player_id ?? '')) ?? 'Batter',
        }));

      const innBowlingRaw = bowlingRaw
        .filter(
          (bw) =>
            String(bw.team_id ?? '') === bowlingTeamId &&
            parseScoreboardInningsNumber(bw.scoreboard, innNum) === innNum
        )
        .sort((a, b) => Number(a.sort ?? 99) - Number(b.sort ?? 99));

      const bowlingCard: BowlerEntry[] = innBowlingRaw.map((bw) => {
        const pid = String(bw.player_id ?? '');
        const bOvers = Number(bw.overs ?? 0);
        const bBalls = oversToBalls(bOvers);
        const bRuns = Number(bw.runs ?? 0);
        return {
          playerId: pid,
          name: playerNameById.get(pid) ?? `Bowler #${pid}`,
          overs: bOvers,
          ballsBowled: bBalls,
          maidens: Number(bw.medians ?? 0),
          runs: bRuns,
          wickets: Number(bw.wickets ?? 0),
          economy: Number(bw.rate ?? calculateEconomy(bRuns, bBalls)),
          wides: Number(bw.wide ?? 0),
          noBalls: Number(bw.noball ?? 0),
          isCurrentBowler:
            Boolean(bw.active) || (lastBallInInn ? lastBallInInn.bowlerId === pid : false),
        };
      });

      // Compute Did Not Bat from squad lineup
      const battingSquad = battingTeamId === teamA.id ? teamA.squad : teamB.squad;
      const battedIds = new Set(battingCard.map((b) => b.playerId));
      const didNotBat = battingSquad
        .filter((p) => !p.isSubstitute && !battedIds.has(p.id))
        .map((p) => p.name);

      // Build OverProgressPoint worm chart data from balls
      const overMap = new Map<number, { runs: number; wickets: number }>();
      for (const ball of innBalls) {
        const ov = ball.overNumber + 1;
        const curr = overMap.get(ov) ?? { runs: 0, wickets: 0 };
        curr.runs += ball.totalRuns;
        if (ball.isWicket) curr.wickets += 1;
        overMap.set(ov, curr);
      }
      const sortedOvers = Array.from(overMap.keys()).sort((a, b) => a - b);
      let cumulativeRuns = 0;
      let cumulativeWkts = 0;
      const overProgress: OverProgressPoint[] = sortedOvers.map((ov) => {
        const item = overMap.get(ov)!;
        cumulativeRuns += item.runs;
        cumulativeWkts += item.wickets;
        return {
          over: ov,
          runs: item.runs,
          cumulativeRuns,
          wickets: cumulativeWkts,
        };
      });

      return {
        inningsNumber: innNum,
        label:
          innNum === 1
            ? '1st Innings'
            : innNum === 2
              ? '2nd Innings'
              : innNum === 3
                ? '3rd Innings'
                : `${innNum}th Innings`,
        battingTeamId,
        bowlingTeamId,
        runs,
        wickets,
        legalBalls,
        oversDisplay: ballsToOversDisplay(legalBalls),
        maxOvers,
        runRate: calculateRunRate(runs, legalBalls),
        extras,
        battingCard,
        bowlingCard,
        didNotBat,
        fallOfWickets,
        partnerships: [],
        overProgress,
      };
    });

    const activeInn = innings[innings.length - 1];
    const firstInn = innings[0];
    let target: number | undefined;
    let requiredRuns: number | undefined;
    let remainingBalls: number | undefined;
    let requiredRunRate: number | undefined;

    if (innings.length === 2 && firstInn && activeInn && activeInn.maxOvers) {
      target = firstInn.runs + 1;
      activeInn.target = target;
      requiredRuns = Math.max(0, target - activeInn.runs);
      remainingBalls = Math.max(0, activeInn.maxOvers * 6 - activeInn.legalBalls);
      requiredRunRate = calculateRequiredRunRate(target, activeInn.runs, remainingBalls);
    }

    const deliveriesNewestFirst = allDeliveriesChrono.slice(-80).reverse();
    const latestBall = deliveriesNewestFirst[0];
    const currentOverBalls = latestBall
      ? allDeliveriesChrono.filter(
          (d) =>
            d.inningsNumber === latestBall.inningsNumber &&
            d.overNumber === latestBall.overNumber
        )
      : [];

    // Officials from Sportmonks includes
    const firstUmp = (raw.firstumpire as Record<string, unknown> | undefined)?.fullname;
    const secondUmp = (raw.secondumpire as Record<string, unknown> | undefined)?.fullname;
    const tvUmp = (raw.tvumpire as Record<string, unknown> | undefined)?.fullname;
    const ref = (raw.referee as Record<string, unknown> | undefined)?.fullname;
    const umpires = [firstUmp, secondUmp].filter((u): u is string => typeof u === 'string' && u.length > 0);
    const officials: MatchOfficials | undefined =
      umpires.length > 0 || tvUmp || ref
        ? {
            umpires: umpires.length > 0 ? umpires : undefined,
            thirdUmpire: typeof tvUmp === 'string' ? tvUmp : undefined,
            matchReferee: typeof ref === 'string' ? ref : undefined,
          }
        : undefined;

    const tossWinnerId = raw.toss_won_team_id ? String(raw.toss_won_team_id) : undefined;
    const tossElected = String(raw.elected ?? '').toLowerCase();
    const winnerTeamId = raw.winner_team_id ? String(raw.winner_team_id) : undefined;

    return {
      id,
      tournamentId: String(raw.season_id ?? leagueRaw.id ?? 'league'),
      tournamentName: String(leagueRaw.name ?? 'International Cricket'),
      matchNumber: String(raw.round ?? `Match #${id}`),
      format,
      status,
      statusText,
      startTime,
      venue: {
        name: String(venueRaw.name ?? 'Venue TBC'),
        stadium: typeof venueRaw.name === 'string' ? venueRaw.name : undefined,
        city: typeof venueRaw.city === 'string' ? venueRaw.city : undefined,
        capacity: typeof venueRaw.capacity === 'number' ? venueRaw.capacity : undefined,
      },
      teamA,
      teamB,
      teamAScores: innings
        .filter((i) => i.battingTeamId === teamA.id)
        .map((i) => ({ label: i.label, score: `${i.runs}/${i.wickets}`, overs: i.oversDisplay })),
      teamBScores: innings
        .filter((i) => i.battingTeamId === teamB.id)
        .map((i) => ({ label: i.label, score: `${i.runs}/${i.wickets}`, overs: i.oversDisplay })),
      currentInningsNumber: activeInn?.inningsNumber ?? 0,
      currentRunRate: activeInn?.runRate,
      requiredRunRate,
      target,
      requiredRuns,
      remainingBalls,
      recentBalls: deliveriesNewestFirst
        .slice(0, 6)
        .reverse()
        .map((d) => ({ id: d.id, chipLabel: d.chipLabel, eventType: d.eventType })),
      winningTeamId: winnerTeamId,
      dataMode: 'live',
      lastUpdated: new Date().toISOString(),
      toss:
        tossWinnerId && (tossElected === 'batting' || tossElected === 'bowling')
          ? {
              winnerTeamId: tossWinnerId,
              winnerName: tossWinnerId === teamA.id ? teamA.name : teamB.name,
              decision: tossElected === 'batting' ? 'bat' : 'bowl',
            }
          : undefined,
      officials,
      innings,
      deliveries: deliveriesNewestFirst,
      currentOverBalls,
      currentBatters: activeInn
        ? activeInn.battingCard.filter((b) => !b.isOut).slice(0, 2)
        : [],
      currentBowler:
        activeInn?.bowlingCard.find((b) => b.isCurrentBowler) ?? activeInn?.bowlingCard[0],
    };
  }
}
