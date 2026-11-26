import express from 'express';
import { createApiRouter } from '../server/apiRouter.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

const apiRouter = createApiRouter();

// Mount on both `/api` and `/` so Vercel rewrites work whether the `/api` prefix is preserved or stripped
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
