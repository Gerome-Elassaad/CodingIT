'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { 
  UserProfile, 
  UserPreferences, 
  UserIntegration, 
  UserSecuritySettings,
  getUserData 
} from '../lib/user-settings'

interface SettingsContextType {
  profile: UserProfile | null
  preferences: UserPreferences | null
  integrations: UserIntegration[]
  securitySettings: UserSecuritySettings | null
  isLoading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth(() => {}, () => {})
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [integrations, setIntegrations] = useState<UserIntegration[]>([])
  const [securitySettings, setSecuritySettings] = useState<UserSecuritySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSettings = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const userData = await getUserData(session.user.id)
      
      if (userData) {
        setProfile(userData.profile)
        setPreferences(userData.preferences)
        setIntegrations(userData.integrations || [])
        setSecuritySettings(userData.securitySettings)
      }
    } catch (err) {
      console.error('Error loading user settings:', err)
      setError('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Load settings when user session changes
  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  const value: SettingsContextType = {
    profile,
    preferences,
    integrations,
    securitySettings,
    isLoading,
    error,
    refreshSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export function SettingsProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>
}
