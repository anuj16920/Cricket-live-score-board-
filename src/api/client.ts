import type {
  ApiStatus,
  BallEventType,
  Delivery,
  MatchDetail,
  MatchSummary,
  TournamentStandings,
} from '../types/cricket';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody?.error) msg = errBody.error;
    } catch {
      // ignore non-json error bodies
    }
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export function fetchApiStatus(): Promise<ApiStatus> {
  return fetchJson<ApiStatus>('/api/status');
}

export interface MatchesResponse {
  mode: 'live' | 'demo';
  provider: string;
  lastUpdated: string;
  matches: MatchSummary[];
}

export function fetchMatches(): Promise<MatchesResponse> {
  return fetchJson<MatchesResponse>('/api/matches');
}

export function fetchMatchDetail(matchId: string): Promise<MatchDetail> {
  return fetchJson<MatchDetail>(`/api/matches/${encodeURIComponent(matchId)}`);
}

export interface StandingsResponse {
  mode: 'live' | 'demo';
  standings: TournamentStandings[];
}

export function fetchAllStandings(): Promise<StandingsResponse> {
  return fetchJson<StandingsResponse>('/api/standings');
}

export function simulateDemoDelivery(
  matchId: string,
  eventType?: BallEventType
): Promise<{ match: MatchDetail; delivery: Delivery }> {
  return fetchJson<{ match: MatchDetail; delivery: Delivery }>(
    `/api/demo/matches/${encodeURIComponent(matchId)}/simulate`,
    {
      method: 'POST',
      body: JSON.stringify(eventType ? { eventType } : {}),
    }
  );
}

export function resetDemoMatch(matchId: string): Promise<MatchDetail> {
  return fetchJson<MatchDetail>(
    `/api/demo/matches/${encodeURIComponent(matchId)}/reset`,
    { method: 'POST' }
  );
}
