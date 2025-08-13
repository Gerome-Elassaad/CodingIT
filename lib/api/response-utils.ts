import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  data?: T
  success: boolean
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  meta?: Record<string, any>
}

export function createSuccessResponse<T = any>(
  data?: T,
  message?: string,
  meta?: Record<string, any>,
  statusCode: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(meta && { meta })
  }

  return NextResponse.json(response, { status: statusCode })
}

export function createPaginatedResponse<T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string,
  meta?: Record<string, any>
): NextResponse {
  const totalPages = Math.ceil(total / limit)
  
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    ...(message && { message }),
    ...(meta && { meta })
  }

  return NextResponse.json(response, { status: 200 })
}

export function createStreamResponse(
  stream: ReadableStream,
  headers?: Record<string, string>
): Response {
  const defaultHeaders = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    ...headers
  }

  return new Response(stream, { headers: defaultHeaders })
}

export function createRedirectResponse(
  url: string,
  statusCode: 302 | 301 = 302
): NextResponse {
  return NextResponse.redirect(url, { status: statusCode })
}

export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export function setCacheHeaders(
  response: NextResponse,
  maxAge: number,
  sMaxAge?: number,
  revalidate?: number
): NextResponse {
  let cacheControl = `max-age=${maxAge}`
  
  if (sMaxAge !== undefined) {
    cacheControl += `, s-maxage=${sMaxAge}`
  }
  
  if (revalidate !== undefined) {
    cacheControl += `, stale-while-revalidate=${revalidate}`
  }
  
  response.headers.set('Cache-Control', cacheControl)
  
  return response
}

export function setRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())
  
  return response
}

export function addCorsHeaders(
  response: NextResponse,
  origin?: string,
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: string[] = ['Content-Type', 'Authorization']
): NextResponse {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '))
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}