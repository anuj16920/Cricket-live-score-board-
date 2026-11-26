import express, { type Router } from 'express';
import type { BallEventType } from '../src/types/cricket';
import { getCricketProvider } from './providers/index.js';

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const ALLOWED_EVENT_TYPES = new Set<BallEventType>([
  'DOT',
  'SINGLE',
  'DOUBLE',
  'TRIPLE',
  'FOUR',
  'SIX',
  'WICKET',
  'WIDE',
  'NO_BALL',
  'BYE',
  'LEG_BYE',
]);

export function createApiRouter(): Router {
  const router = express.Router();
  const provider = getCricketProvider();

  const applyCacheHeaders = (res: express.Response, maxAgeSeconds: number) => {
    if (provider.mode === 'live') {
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`
      );
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
  };

  // Health & provider status
  router.get('/status', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const status = await provider.getStatus();
      res.json(status);
    } catch {
      res.status(500).json({ error: 'Unable to query cricket data provider status.' });
    }
  });

  // All matches (live, upcoming, completed)
  router.get('/matches', async (_req, res) => {
    applyCacheHeaders(res, 15);
    try {
      const matches = await provider.getMatches();
      res.json({
        mode: provider.mode,
        provider: provider.name,
        lastUpdated: new Date().toISOString(),
        matches,
      });
    } catch {
      res.status(502).json({ error: 'Failed to retrieve matches from cricket data provider.' });
    }
  });

  // Single match detail (full scoreboard, scorecard, squads, commentary, match info)
  router.get('/matches/:id', async (req, res) => {
    const matchId = req.params.id;
    if (!SAFE_ID_REGEX.test(matchId)) {
      res.status(400).json({ error: 'Invalid match identifier.' });
      return;
    }
    applyCacheHeaders(res, 12);
    try {
      const detail = await provider.getMatchDetail(matchId);
      if (!detail) {
        res.status(404).json({ error: 'Match not found.' });
        return;
      }
      res.json(detail);
    } catch {
      res.status(502).json({ error: 'Failed to retrieve match detail.' });
    }
  });

  // Ball-by-ball commentary endpoint
  router.get('/matches/:id/balls', async (req, res) => {
    const matchId = req.params.id;
    if (!SAFE_ID_REGEX.test(matchId)) {
      res.status(400).json({ error: 'Invalid match identifier.' });
      return;
    }
    applyCacheHeaders(res, 10);
    try {
      const deliveries = await provider.getMatchBalls(matchId);
      res.json({ matchId, deliveries, lastUpdated: new Date().toISOString() });
    } catch {
      res.status(502).json({ error: 'Failed to retrieve ball-by-ball deliveries.' });
    }
  });

  // All tournament standings
  router.get('/standings', async (_req, res) => {
    applyCacheHeaders(res, 60);
    try {
      const standings = await provider.getAllStandings();
      res.json({ mode: provider.mode, standings });
    } catch {
      res.status(502).json({ error: 'Failed to retrieve tournament standings.' });
    }
  });

  // Single tournament standings
  router.get('/standings/:tournamentId', async (req, res) => {
    const tournamentId = req.params.tournamentId;
    if (!SAFE_ID_REGEX.test(tournamentId)) {
      res.status(400).json({ error: 'Invalid tournament identifier.' });
      return;
    }
    applyCacheHeaders(res, 60);
    try {
      const standings = await provider.getStandings(tournamentId);
      if (!standings) {
        res.status(404).json({ error: 'Standings not available for this tournament.' });
        return;
      }
      res.json(standings);
    } catch {
      res.status(502).json({ error: 'Failed to retrieve standings.' });
    }
  });

  // Demo Mode interactive delivery simulator (only active when provider.mode === 'demo')
  router.post('/demo/matches/:id/simulate', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const matchId = req.params.id;
    if (!SAFE_ID_REGEX.test(matchId)) {
      res.status(400).json({ error: 'Invalid match identifier.' });
      return;
    }
    if (provider.mode !== 'demo' || !provider.simulateDelivery) {
      res.status(403).json({ error: 'Simulation is only available in Demo Mode.' });
      return;
    }

    const rawEvent = req.body?.eventType;
    let eventType: BallEventType | undefined;
    if (rawEvent !== undefined) {
      if (typeof rawEvent !== 'string' || !ALLOWED_EVENT_TYPES.has(rawEvent as BallEventType)) {
        res.status(400).json({ error: 'Unsupported delivery event type.' });
        return;
      }
      eventType = rawEvent as BallEventType;
    }

    const result = await provider.simulateDelivery(matchId, eventType);
    if (!result) {
      res.status(409).json({ error: 'Match is not currently live or was not found.' });
      return;
    }
    res.json(result);
  });

  // Demo Mode match reset
  router.post('/demo/matches/:id/reset', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const matchId = req.params.id;
    if (!SAFE_ID_REGEX.test(matchId)) {
      res.status(400).json({ error: 'Invalid match identifier.' });
      return;
    }
    if (provider.mode !== 'demo' || !provider.resetDemoMatch) {
      res.status(403).json({ error: 'Reset is only available in Demo Mode.' });
      return;
    }
    const reset = await provider.resetDemoMatch(matchId);
    if (!reset) {
      res.status(404).json({ error: 'Demo match not found.' });
      return;
    }
    res.json(reset);
  });

  // Explicit JSON 404 fallback for unmatched API routes
  router.use((_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return router;
}
