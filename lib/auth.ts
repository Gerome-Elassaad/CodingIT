import { createSupabaseBrowserClient } from './supabase-browser'
import { ViewType } from '@/components/auth'
import { Session, AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { useState, useEffect } from 'react'

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: ViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [recovery, setRecovery] = useState(false)
  const [loading, setLoading] = useState(true)
  const posthog = usePostHog()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient(); // Initialize Supabase client here

    if (!supabase) {
      console.error('Supabase is not initialized - authentication will not work')
      setLoading(false)
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      const user = session?.user

      if (user) {
        if (!user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(user.id, {
          email: user.email,
          supabase_id: user.id,
        })
        posthog.capture('sign_in')
      }
      setLoading(false)

      if (_event === 'PASSWORD_RECOVERY') {
        setRecovery(true)
        setAuthView('update_password')
        setAuthDialog(true)
      }

      if (_event === 'USER_UPDATED' && recovery) {
        setRecovery(false)
      }

      if (_event === 'SIGNED_IN' && !recovery) {
        setAuthDialog(false)
        if (!session?.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }

      if (_event === 'SIGNED_OUT') {
        setAuthView('sign_in')
        posthog.capture('sign_out')
        posthog.reset()
        setRecovery(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [recovery, posthog, setAuthDialog, setAuthView])

  return {
    session,
    loading,
  }
}
