import { NextRequest, NextResponse } from 'next/server'
import ratelimit from '@/lib/ratelimit'
import { Duration } from '@/lib/duration'
import { validateRequest, AuthenticatedUser } from './auth'
import { createErrorResponse, ApiException, createConfigError } from './errors'
import { setSecurityHeaders, setRateLimitHeaders } from './response-utils'

export interface MiddlewareContext {
  request: NextRequest
  auth?: AuthenticatedUser
  params?: Record<string, string | string[]>
  metadata?: Record<string, any>
}

export type MiddlewareHandler = (
  context: MiddlewareContext
) => Promise<NextResponse | void>

export type RouteHandler = (
  context: MiddlewareContext
) => Promise<NextResponse | Response>

export interface MiddlewareOptions {
  auth?: {
    required?: boolean
    requireTeam?: string
    requireRole?: ('owner' | 'admin' | 'member')[]
    requireGitHub?: boolean
  }
  rateLimit?: {
    max?: number
    window?: Duration
    skipWithApiKey?: boolean
  }
  validation?: {
    environmentVars?: string[]
    maxBodySize?: number
  }
  cors?: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
  }
  cache?: {
    maxAge?: number
    sMaxAge?: number
    revalidate?: number
  }
  security?: {
    enableSecurityHeaders?: boolean
  }
}

class MiddlewareChain {
  private middlewares: MiddlewareHandler[] = []
  private options: MiddlewareOptions

  constructor(options: MiddlewareOptions = {}) {
    this.options = options
    this.setupDefaultMiddlewares()
  }

  private setupDefaultMiddlewares() {
    // Security headers middleware
    if (this.options.security?.enableSecurityHeaders !== false) {
      this.use(this.securityMiddleware)
    }

    // Environment validation middleware
    if (this.options.validation?.environmentVars) {
      this.use(this.environmentValidationMiddleware)
    }

    // CORS middleware
    if (this.options.cors) {
      this.use(this.corsMiddleware)
    }

    // Rate limiting middleware
    if (this.options.rateLimit) {
      this.use(this.rateLimitMiddleware)
    }

    // Authentication middleware
    if (this.options.auth) {
      this.use(this.authMiddleware)
    }
  }

  use(middleware: MiddlewareHandler): this {
    this.middlewares.push(middleware)
    return this
  }

  async execute(
    request: NextRequest,
    routeHandler: RouteHandler,
    params?: Record<string, string | string[]>
  ): Promise<NextResponse | Response> {
    const context: MiddlewareContext = {
      request,
      params,
      metadata: {}
    }

    try {
      // Execute all middlewares
      for (const middleware of this.middlewares) {
        const result = await middleware(context)
        if (result instanceof NextResponse) {
          return result
        }
      }

      // Execute the route handler
      const result = await routeHandler(context)
      return result
    } catch (error) {
      console.error('Middleware chain error:', error)
      
      if (error instanceof ApiException) {
        return createErrorResponse(error)
      }
      
      return createErrorResponse(
        'Internal server error',
        undefined,
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  private securityMiddleware = async (context: MiddlewareContext): Promise<void> => {
    // Security headers will be added to the response
  }

  private environmentValidationMiddleware = async (context: MiddlewareContext): Promise<void> => {
    const { environmentVars } = this.options.validation!
    const missing = environmentVars!.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw createConfigError(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  private corsMiddleware = async (context: MiddlewareContext): Promise<NextResponse | void> => {
    const { request } = context
    const { cors } = this.options

    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 })
      
      if (cors!.origin) {
        const origins = Array.isArray(cors!.origin) ? cors!.origin : [cors!.origin]
        const requestOrigin = request.headers.get('Origin')
        
        if (requestOrigin && origins.includes(requestOrigin)) {
          response.headers.set('Access-Control-Allow-Origin', requestOrigin)
        }
      }
      
      if (cors!.methods) {
        response.headers.set('Access-Control-Allow-Methods', cors!.methods.join(', '))
      }
      
      if (cors!.headers) {
        response.headers.set('Access-Control-Allow-Headers', cors!.headers.join(', '))
      }
      
      response.headers.set('Access-Control-Max-Age', '86400')
      
      return response
    }
  }

  private rateLimitMiddleware = async (context: MiddlewareContext): Promise<NextResponse | void> => {
    const { request } = context
    const { rateLimit } = this.options

    if (!rateLimit) return

    // Skip rate limiting if API key is provided and skipWithApiKey is true
    if (rateLimit.skipWithApiKey) {
      try {
        const body = await request.clone().json()
        if (body.config?.apiKey) return
      } catch {
        // Continue with rate limiting if body parsing fails
      }
    }

    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    const limit = await ratelimit(
      ip,
      rateLimit.max || 10,
      rateLimit.window || '1d'
    )

    if (limit) {
      const response = createErrorResponse(
        'You have reached your request limit for the day.',
        undefined,
        429,
        undefined,
        60
      )
      
      setRateLimitHeaders(response, limit.amount, limit.remaining, limit.reset)
      
      return response
    }
  }

  private authMiddleware = async (context: MiddlewareContext): Promise<void> => {
    const { request } = context
    const { auth } = this.options

    if (!auth) return

    const authResult = await validateRequest(request, {
      requireAuth: auth.required,
      requireTeam: auth.requireTeam,
      requireRole: auth.requireRole,
      requireGitHub: auth.requireGitHub
    })

    if (authResult) {
      context.auth = authResult
    }
  }
}

export function createApiRoute(
  handler: RouteHandler,
  options: MiddlewareOptions = {}
) {
  const chain = new MiddlewareChain(options)

  return async (
    request: NextRequest,
    context?: { params?: Record<string, string | string[]> }
  ): Promise<NextResponse | Response> => {
    const response = await chain.execute(request, handler, context?.params)
    
    // Apply security headers to the response if it's a NextResponse
    if (options.security?.enableSecurityHeaders !== false && response instanceof NextResponse) {
      setSecurityHeaders(response)
    }
    
    return response
  }
}

// Convenience functions for common middleware configurations
export function createPublicApiRoute(handler: RouteHandler, options: Omit<MiddlewareOptions, 'auth'> = {}) {
  return createApiRoute(handler, {
    ...options,
    auth: { required: false }
  })
}

export function createProtectedApiRoute(handler: RouteHandler, options: Omit<MiddlewareOptions, 'auth'> = {}) {
  return createApiRoute(handler, {
    ...options,
    auth: { required: true, ...options }
  })
}

export function createTeamApiRoute(
  handler: RouteHandler,
  teamId: string,
  options: Omit<MiddlewareOptions, 'auth'> = {}
) {
  return createApiRoute(handler, {
    ...options,
    auth: { required: true, requireTeam: teamId, ...options }
  })
}

export function createRateLimitedApiRoute(
  handler: RouteHandler,
  rateLimitConfig: NonNullable<MiddlewareOptions['rateLimit']>,
  options: Omit<MiddlewareOptions, 'rateLimit'> = {}
) {
  return createApiRoute(handler, {
    ...options,
    rateLimit: rateLimitConfig
  })
}

// Helper to wrap existing Next.js API route handlers
export function withMiddleware(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return createApiRoute(async ({ request, auth, params }) => {
    // Add auth to the request context if available
    if (auth) {
      (request as any).auth = auth
    }
    
    return handler(request, { params })
  }, options)
}