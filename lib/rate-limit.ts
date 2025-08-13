import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, data] of Array.from(rateLimitStore.entries())) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(request: NextRequest): NextResponse | null {
    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      cleanupExpiredEntries()
    }

    // Get client identifier (IP address or user ID if available)
    const clientId = request.ip || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'anonymous'

    const now = Date.now()
    const windowStart = now - config.windowMs
    const key = `${clientId}`

    const existing = rateLimitStore.get(key)
    
    if (!existing || now > existing.resetTime) {
      // First request in window or window has expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return null
    }

    if (existing.count >= config.maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: Math.ceil((existing.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((existing.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': existing.resetTime.toString()
          }
        }
      )
    }

    // Increment count
    existing.count++
    rateLimitStore.set(key, existing)

    return null
  }
}

// Pre-configured rate limiters
export const billingRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 requests per minute
})

export const checkoutRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3 // 3 checkout attempts per 5 minutes
})