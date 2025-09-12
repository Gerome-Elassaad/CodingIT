'use client'

import { createContext, useContext, useState } from 'react'
import { useAuth } from './auth'
import { Session } from '@supabase/supabase-js'
import { UserTeamProvider } from './user-team-provider'
import { ViewType } from '@/components/auth'

type AuthContextType = {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, setAuthDialog, setAuthView }: { children: React.ReactNode, setAuthDialog: (isOpen: boolean) => void, setAuthView: (view: ViewType) => void }) {
  const { session, loading } = useAuth(setAuthDialog, setAuthView)

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <UserTeamProvider session={session}>{children}</UserTeamProvider>
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
