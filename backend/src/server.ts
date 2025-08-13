import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { codeRouter } from './routes/code';
import { deploymentsRouter } from './routes/deployments';
import { edgeFlagsRouter } from './routes/edge-flags';
import { filesRouter } from './routes/files';
import { flagsRouter } from './routes/flags';
import { importDatasetRouter } from './routes/import-dataset';
import { integrationsRouter } from './routes/integrations';
import { sandboxRouter } from './routes/sandbox';
import { stripeRouter } from './routes/stripe';
import { subscriptionRouter } from './routes/subscription';
import { terminalRouter } from './routes/terminal';
import { webhooksRouter } from './routes/webhooks';
import { workflowsRouter } from './routes/workflows';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'https://codinit.dev',
    'https://www.codinit.dev',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/code', codeRouter);
app.use('/api/deployments', deploymentsRouter);
app.use('/api/edge-flags', edgeFlagsRouter);
app.use('/api/files', filesRouter);
app.use('/api/flags', flagsRouter);
app.use('/api/import-dataset', importDatasetRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/sandbox', sandboxRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/terminal', terminalRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/workflows', workflowsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;