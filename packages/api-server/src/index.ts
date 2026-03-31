import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initWebSocket } from './websocket.js';
import tasksRouter from './routes/tasks.js';
import agentsRouter from './routes/agents.js';
import projectsRouter from './routes/projects.js';
import activitiesRouter from './routes/activities.js';
import notifyRouter from './routes/notify.js';
import metricsRouter from './routes/metrics.js';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/notify', notifyRouter);
app.use('/api/metrics', metricsRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

initWebSocket(httpServer);

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
