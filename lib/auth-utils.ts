import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import type { User } from '@supabase/supabase-js'

export async function authenticateUser(): Promise<{ user: User; error: null } | { user: null; error: NextResponse }> {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Higher-order function that wraps API route handlers with authentication
 * @param handler The API route handler function
 * @returns Wrapped handler that includes authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: User, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const { user, error } = await authenticateUser()
    
    if (error) {
      return error
    }

    return handler(user!, ...args)
  }
}