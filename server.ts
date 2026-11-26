import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BallEventType } from './src/types/cricket';
import { getCricketProvider } from './server/providers/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function startServer() {
  const app = express();
  const provider = getCricketProvider();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  // Health & provider status
  app.get('/api/status', async (_req, res) => {
    try {
      const status = await provider.getStatus();
      res.json(status);
    } catch {
      res.status(500).json({ error: 'Unable to query cricket data provider status.' });
    }
  });

  // All matches (live, upcoming, completed)
  app.get('/api/matches', async (_req, res) => {
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
  app.get('/api/matches/:id', async (req, res) => {
    const matchId = req.params.id;
    if (!SAFE_ID_REGEX.test(matchId)) {
      res.status(400).json({ error: 'Invalid match identifier.' });
      return;
    }
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
  app.get('/api/matches/:id/balls', async (req, res) => {
    const matchId = req.params.id;
    if (!SAFE_ID_REGEX.test(matchId)) {
      res.status(400).json({ error: 'Invalid match identifier.' });
      return;
    }
    try {
      const deliveries = await provider.getMatchBalls(matchId);
      res.json({ matchId, deliveries, lastUpdated: new Date().toISOString() });
    } catch {
      res.status(502).json({ error: 'Failed to retrieve ball-by-ball deliveries.' });
    }
  });

  // All tournament standings
  app.get('/api/standings', async (_req, res) => {
    try {
      const standings = await provider.getAllStandings();
      res.json({ mode: provider.mode, standings });
    } catch {
      res.status(502).json({ error: 'Failed to retrieve tournament standings.' });
    }
  });

  // Single tournament standings
  app.get('/api/standings/:tournamentId', async (req, res) => {
    const tournamentId = req.params.tournamentId;
    if (!SAFE_ID_REGEX.test(tournamentId)) {
      res.status(400).json({ error: 'Invalid tournament identifier.' });
      return;
    }
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
  app.post('/api/demo/matches/:id/simulate', async (req, res) => {
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
  app.post('/api/demo/matches/:id/reset', async (req, res) => {
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

  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT ?? 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BOUNDARYLIVE server running on http://0.0.0.0:${PORT} (${provider.mode.toUpperCase()} mode)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BOUNDARYLIVE server:', err);
  process.exit(1);
});
