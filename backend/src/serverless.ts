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

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://codinit.dev',
    'https://www.codinit.dev',
    'https://codingit-1.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Forwarded-For']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware for serverless
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    serverless: true
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'CodingIT Backend API - Serverless',
    version: '1.0.0',
    status: 'running'
  });
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
  console.error('Serverless API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Export the Express app for serverless deployment
export default app;

// For Vercel serverless functions
export { app as handler };