import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Declare a global variable to store the Supabase client
declare global {
  var supabaseClient: SupabaseClient<Database> | undefined
}

export function createSupabaseBrowserClient(): SupabaseClient<Database> | null {
    // Return null during SSR
    if (typeof window === 'undefined') {
        return null
    }
    
    // Use a global variable to prevent re-initialization during Fast Refresh
    if (!window.supabaseClient) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseAnonKey) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Supabase URL or Anon Key are missing in development. Returning null client.');
                return null;
            }
            throw new Error('Supabase URL and Anon Key are required.')
        }
        
        window.supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
    }
    
    return window.supabaseClient
}
