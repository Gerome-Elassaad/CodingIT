# Backend Architecture Documentation

## Overview

The CodInit platform has been architected with a **decoupled backend** that can run independently from the Next.js frontend. This allows for flexible deployment options including traditional servers, serverless functions, and microservices.

## Architecture Design

### Frontend-Backend Separation

```
┌─────────────────┐    HTTP/HTTPS     ┌─────────────────┐
│   Next.js App   │ ──────────────────► │  Express.js API │
│  (codinit.dev)  │                   │ (api.codinit.dev)│
└─────────────────┘                   └─────────────────┘
```

- **Frontend**: Next.js application with React components
- **Backend**: Express.js API server with modular route handlers
- **Communication**: RESTful API with JSON payloads

### Environment Configuration

The system automatically switches between environments:

```typescript
// lib/config.ts
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.codinit.dev'
  : 'http://localhost:3001';
```

## Backend Structure

### Directory Layout

```
backend/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── auth/         # Authentication routes
│   │   ├── chat/         # AI chat functionality
│   │   ├── code/         # Code execution
│   │   ├── files/        # File operations
│   │   ├── sandbox/      # E2B sandbox management
│   │   └── ...
│   ├── server.ts         # Traditional Express server
│   ├── serverless.ts     # Serverless Express app
│   └── lambda.ts         # AWS Lambda handler
├── package.json          # Backend dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # Deployment instructions
```

### Route Module Pattern

Each route module follows a consistent pattern:

```typescript
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Route handlers
router.get('/', async (req, res) => {
  try {
    // Business logic
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as routerName };
```

## API Routes

### Core Endpoints

#### Authentication (`/api/auth/*`)
- `POST /api/auth/github` - GitHub OAuth authentication
- `DELETE /api/auth/github/revoke` - Revoke GitHub access

#### AI Chat (`/api/chat/*`)
- `POST /api/chat` - AI code generation with streaming
- `POST /api/chat/workflow` - Multi-step workflow generation

#### Code Execution (`/api/code/*`)
- `POST /api/code/execute` - Execute code in E2B sandboxes

#### File Operations (`/api/files/*`)
- `GET /api/files` - List files in sandbox
- `GET /api/files/content` - Read file content
- `POST /api/files` - Create/update files
- `DELETE /api/files` - Delete files
- `POST /api/files/batch` - Batch file operations

#### Sandbox Management (`/api/sandbox/*`)
- `POST /api/sandbox` - Create new sandbox
- `DELETE /api/sandbox` - Destroy sandbox
- `POST /api/terminal` - Execute terminal commands

#### Workflows (`/api/workflows/*`)
- `GET /api/workflows` - List user workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow details
- `POST /api/workflows/:id/execute` - Execute workflow

#### Integrations (`/api/integrations/*`)
- `GET /api/integrations/github/repos` - List GitHub repositories
- `POST /api/integrations/github/import` - Import repository

#### Payments (`/api/stripe/*`)
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Customer portal
- `POST /api/stripe/webhooks` - Stripe webhooks

## Deployment Options

### 1. Traditional Server Deployment

Run as a standalone Express.js server:

```bash
cd backend
npm install
npm run build
npm start
```

**Environment**: Any VPS, Docker container, or PaaS platform

### 2. Serverless Deployment (Vercel)

Deploy as serverless functions:

```bash
# From project root
vercel --prod
```

**Configuration**: Uses `vercel.json` and `api/index.ts` entry point

### 3. AWS Lambda

Deploy to AWS Lambda:

```bash
cd backend
npm run build
# Deploy using AWS SAM, Serverless Framework, or CDK
```

**Handler**: Uses `src/lambda.ts` with serverless-http

### 4. Other Platforms

The modular design supports:
- **Netlify Functions**
- **Cloudflare Workers**
- **Azure Functions**
- **Google Cloud Functions**

## Key Features

### CORS Configuration

Configured for secure cross-origin requests:

```typescript
const corsOptions = {
  origin: [
    'https://codinit.dev',
    'https://www.codinit.dev',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
```

### Request/Response Handling

- **JSON parsing** with 50MB limit for large file uploads
- **Error middleware** for centralized error handling
- **Health check** endpoint at `/health`
- **404 handling** for undefined routes

### Security Features

- **Rate limiting** using Upstash Redis
- **Input validation** with Zod schemas
- **Environment variable protection**
- **CORS security headers**

## Environment Variables

### Required Variables

```bash
# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
MISTRAL_API_KEY=

# E2B Code Execution
E2B_API_KEY=

# Database & Auth
SUPABASE_URL=
SUPABASE_ANON_KEY=

# GitHub Integration
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Payment Processing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Rate Limiting
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

### Optional Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Migration from Next.js API Routes

### Conversion Pattern

**Next.js Route Handler:**
```typescript
// app/api/example/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const param = searchParams.get('param');
  return NextResponse.json({ data: param });
}
```

**Express Route Handler:**
```typescript
// backend/src/routes/example/index.ts
router.get('/', async (req, res) => {
  const { param } = req.query;
  res.json({ data: param });
});
```

### Key Differences

1. **Request Object**: `Request` → `req` (Express Request)
2. **Response Object**: `NextResponse` → `res` (Express Response)
3. **Query Parameters**: `request.nextUrl.searchParams` → `req.query`
4. **Path Parameters**: `context.params` → `req.params`
5. **Request Body**: `await request.json()` → `req.body`

## Development Workflow

### Local Development

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev  # Runs on localhost:3001
   ```

2. **Start Frontend:**
   ```bash
   npm run dev  # Runs on localhost:3000
   ```

### Testing API Endpoints

Use the health check endpoint to verify the backend is running:

```bash
curl http://localhost:3001/health
# Response: {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Frontend Integration

All frontend API calls automatically use the correct backend URL:

```typescript
// Automatically resolves to correct endpoint
const response = await fetch(`${API_BASE_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
});
```

## Performance Considerations

### Serverless Cold Starts

- **Optimized bundle size** with selective imports
- **Minimal dependencies** in serverless functions
- **Connection pooling** for database connections

### Traditional Server Benefits

- **No cold starts** for consistent latency
- **Persistent connections** to external services
- **Background processing** capabilities

### Caching Strategy

- **Redis caching** for rate limiting
- **Response caching** for expensive operations
- **Static asset optimization**

## Monitoring & Observability

### Health Monitoring

- **Health check endpoint** for load balancer health checks
- **Error logging** with structured logging
- **Performance metrics** collection

### Debugging

- **Request/response logging** in development
- **Error stack traces** with source maps
- **Environment-specific logging levels**

## Security Best Practices

### API Security

- **Input validation** on all endpoints
- **Rate limiting** to prevent abuse
- **CORS policy** enforcement
- **Environment variable protection**

### Authentication

- **Supabase Auth** integration
- **GitHub OAuth** for repository access
- **JWT token validation**
- **Session management**

### Data Protection

- **No secrets in logs**
- **Encrypted environment variables**
- **Secure cookie handling**
- **HTTPS enforcement in production**

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check origin configuration in CORS options
2. **Connection Errors**: Verify API_BASE_URL configuration
3. **Rate Limiting**: Check Upstash Redis connection
4. **Environment Variables**: Ensure all required variables are set

### Debug Commands

```bash
# Check backend health
curl https://api.codinit.dev/health

# Test local backend
curl http://localhost:3001/health

# Check frontend config
console.log(API_BASE_URL);
```

## Future Enhancements

### Planned Features

- **API versioning** support (v1, v2, etc.)
- **GraphQL endpoint** for flexible querying
- **WebSocket support** for real-time features
- **Microservices** architecture for scaling

### Scalability Improvements

- **Database connection pooling**
- **Horizontal scaling** with load balancers
- **Caching layers** with Redis
- **CDN integration** for static assets
