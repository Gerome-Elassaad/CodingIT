import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } from './supabase-credentials'

export function createServerClient(useServiceRole = true) {
  const cookieStore = cookies()
  const supabaseKey = useServiceRole
    ? supabaseServiceRoleKey
    : supabaseAnonKey

  return _createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
