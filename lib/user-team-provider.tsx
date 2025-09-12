'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { LRUCache } from 'lru-cache'
import { createSupabaseBrowserClient } from './supabase-browser'

const supabase = createSupabaseBrowserClient()

type UserTeam = {
  email: string
  id: string
  name: string
  tier: string
}

const userTeamCache = new LRUCache<string, UserTeam>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
})

export async function getUserTeam(
  session: Session,
): Promise<UserTeam | undefined> {
  const cacheKey = `user-team:${session.user.id}`
  const cachedUserTeam = userTeamCache.get(cacheKey)

  if (cachedUserTeam) {
    return cachedUserTeam
  }

  const { data: defaultTeam } = await supabase!
    .from('users_teams')
    .select('teams!inner(id, name, tier, email)')
    .eq('user_id', session?.user.id)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (defaultTeam) {
    userTeamCache.set(cacheKey, defaultTeam)
  }
}

type UserTeamContextType = {
  userTeam: UserTeam | undefined
  loading: boolean
}

const UserTeamContext = createContext<UserTeamContextType | undefined>(
  undefined,
)

export function UserTeamProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [userTeam, setUserTeam] = useState<UserTeam | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      getUserTeam(session).then(userTeam => {
        setUserTeam(userTeam)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [session])

  return (
    <UserTeamContext.Provider value={{ userTeam, loading }}>
      {children}
    </UserTeamContext.Provider>
  )
}

export function useUserTeam() {
  const context = useContext(UserTeamContext)
  if (context === undefined) {
    throw new Error('useUserTeam must be used within a UserTeamProvider')
  }
  return context
}
