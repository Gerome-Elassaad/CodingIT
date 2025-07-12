import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function createBrowserClient() {
    // Return existing instance if available
    if (supabaseInstance) {
        return supabaseInstance
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
        // Return null in development when Supabase is not configured
        if (process.env.NODE_ENV === 'development') {
            console.warn('Supabase credentials not configured - running in demo mode')
            return null
        }
        throw new Error('Supabase URL and Anon Key are required')
    }
    
    // Create and cache the instance
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseInstance
}
