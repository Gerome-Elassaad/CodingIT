# CodingIT Backend - Express.js API with Serverless Support

This backend has been converted from Next.js API routes to Express.js with full serverless support for multiple platforms.

## Architecture

- **Express.js**: Core API framework
- **Serverless**: Supports Vercel, AWS Lambda, and other serverless platforms
- **TypeScript**: Full type safety
- **Modular Routes**: Each API endpoint is organized into separate router modules

## Project Structure

```
backend/src/
├── routes/
│   ├── auth/index.ts          # Authentication routes
│   ├── chat/index.ts          # AI chat and workflow routes
│   ├── code/index.ts          # Code execution routes
│   ├── files/index.ts         # File system operations
│   ├── sandbox/index.ts       # E2B sandbox management
│   ├── deployments/index.ts   # Deployment management
│   ├── integrations/index.ts  # Third-party integrations
│   ├── stripe/index.ts        # Payment processing
│   ├── webhooks/index.ts      # Webhook handlers
│   └── workflows/index.ts     # Workflow management
├── server.ts                  # Traditional Express server
├── serverless.ts             # Serverless-ready Express app
└── lambda.ts                 # AWS Lambda specific handler
```

## Environment Variables

```bash
# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
MISTRAL_API_KEY=
XAI_API_KEY=
DEEPSEEK_API_KEY=

# E2B Code Execution
E2B_API_KEY=

# Supabase Database & Auth
SUPABASE_URL=
SUPABASE_ANON_KEY=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=

# Stripe Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Rate Limiting (Upstash Redis)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Site Configuration
NEXT_PUBLIC_SITE_URL=

# Rate Limiting Configuration
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW=1d
```

## Development

### Local Development

```bash
cd backend
npm install
npm run dev
```

The server will start on http://localhost:3001

### Traditional Server Deployment

```bash
npm run build
npm start
```

## Serverless Deployment

### Vercel Deployment

1. **Automatic Deployment** (Recommended):
   ```bash
   # Deploy from root directory
   vercel --prod
   ```

2. **Manual Setup**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

The `vercel.json` configuration is already set up to route all `/api/*` requests to the serverless function.

### AWS Lambda Deployment

1. **Using Serverless Framework**:
   ```yaml
   # serverless.yml
   service: codinit-backend
   
   provider:
     name: aws
     runtime: nodejs18.x
     
   functions:
     api:
       handler: dist/lambda.handler
       events:
         - httpApi: '*'
   ```

2. **Deploy**:
   ```bash
   npm run build
   serverless deploy
   ```

### Other Serverless Platforms

The `serverless.ts` file exports a standard Express app that can be adapted for:
- **Netlify Functions**
- **Cloudflare Workers** (with minor modifications)
- **Azure Functions**
- **Google Cloud Functions**

## API Routes

### Authentication
- `GET /api/auth/github` - GitHub OAuth callback
- `POST /api/auth/github/revoke` - Revoke GitHub token

### Chat & AI
- `POST /api/chat` - AI code generation
- `POST /api/chat/workflow` - Workflow generation

### Code Execution
- `POST /api/code/execute` - Execute code in sandbox

### File Operations
- `GET /api/files` - List sandbox files

### Sandbox Management
- `POST /api/sandbox` - Create and execute sandbox

### Other Routes
- Health check: `GET /health`
- All routes include proper error handling and CORS

## Key Features

✅ **Converted Routes**: All Next.js API routes converted to Express routers  
✅ **Serverless Ready**: Works on Vercel, AWS Lambda, and other platforms  
✅ **Type Safety**: Full TypeScript support  
✅ **Error Handling**: Comprehensive error handling middleware  
✅ **CORS Support**: Configured for frontend integration  
✅ **Rate Limiting**: Built-in rate limiting support  
✅ **Health Checks**: Monitoring and health endpoints  
✅ **Request Logging**: Detailed logging for debugging  

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Test routes locally with `npm run dev`
- [ ] Build successfully with `npm run build`
- [ ] Deploy to chosen platform
- [ ] Verify health endpoint: `/health`
- [ ] Test key API endpoints
- [ ] Monitor logs for any errors

## Migration Notes

### From Next.js API Routes

- **Request/Response**: Next.js `Request`/`NextResponse` → Express `req`/`res`
- **Route Parameters**: Next.js `[param]` → Express `:param`
- **Query Parameters**: `request.nextUrl.searchParams` → `req.query`
- **Request Body**: `await request.json()` → `req.body`
- **HTTP Methods**: `export async function GET` → `router.get()`

### Route Structure Changes

```typescript
// Before (Next.js)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionID = searchParams.get('sessionID')
  return NextResponse.json(data)
}

// After (Express)
router.get('/', async (req, res) => {
  const sessionID = req.query.sessionID as string
  return res.json(data)
})
```

## Monitoring & Debugging

- **Logs**: Check platform-specific logs (Vercel logs, CloudWatch, etc.)
- **Health Check**: `GET /health` returns server status
- **Error Responses**: All errors include timestamps and request IDs
- **CORS**: Configured for development and production domains

## Support

For issues with:
- **Route Conversion**: Check the individual router files in `/routes`
- **Serverless Deployment**: Review `serverless.ts` and platform configurations
- **Environment Variables**: Ensure all required vars are set on your platform
- **CORS Issues**: Update allowed origins in `serverless.ts`