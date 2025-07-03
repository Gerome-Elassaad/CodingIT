import { supabase } from './supabase'

export interface UserProfile {
  id: string
  user_id: string
  full_name?: string
  display_name?: string
  work_description?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  ai_assistance: boolean
  smart_suggestions: boolean
  theme: 'light' | 'dark' | 'system'
  font_family: 'inter' | 'jetbrains-mono' | 'cal-sans'
  email_notifications: boolean
  marketing_emails: boolean
  security_alerts: boolean
  created_at: string
  updated_at: string
}

export interface UserIntegration {
  id: string
  user_id: string
  service_name: string
  is_connected: boolean
  connection_data?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UserSecuritySettings {
  id: string
  user_id: string
  two_factor_enabled: boolean
  backup_codes?: string[]
  last_password_change?: string
  created_at: string
  updated_at: string
}

// User Profile Operations
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found, create default one
      return await createUserProfile(userId)
    }
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function createUserProfile(userId: string, profile?: Partial<UserProfile>): Promise<UserProfile | null> {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      full_name: profile?.full_name || '',
      display_name: profile?.display_name || '',
      work_description: profile?.work_description || '',
      avatar_url: profile?.avatar_url || ''
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  if (!supabase || !userId) return false

  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
    return false
  }

  return true
}

// User Preferences Operations
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No preferences found, create default ones
      return await createUserPreferences(userId)
    }
    console.error('Error fetching user preferences:', error)
    return null
  }

  return data
}

export async function createUserPreferences(userId: string, preferences?: Partial<UserPreferences>): Promise<UserPreferences | null> {
  if (!supabase || !userId) return null

  const defaultPreferences = {
    user_id: userId,
    ai_assistance: true,
    smart_suggestions: false,
    theme: 'system' as const,
    font_family: 'inter' as const,
    email_notifications: true,
    marketing_emails: false,
    security_alerts: true,
    ...preferences
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .insert(defaultPreferences)
    .select()
    .single()

  if (error) {
    console.error('Error creating user preferences:', error)
    return null
  }

  return data
}

export async function updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<boolean> {
  if (!supabase || !userId) return false

  const { error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user preferences:', error)
    return false
  }

  return true
}

// User Integrations Operations
export async function getUserIntegrations(userId: string): Promise<UserIntegration[]> {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .order('service_name')

  if (error) {
    console.error('Error fetching user integrations:', error)
    return []
  }

  return data || []
}

export async function upsertUserIntegration(userId: string, serviceName: string, integration: Partial<UserIntegration>): Promise<boolean> {
  if (!supabase || !userId) return false

  const { error } = await supabase
    .from('user_integrations')
    .upsert({
      user_id: userId,
      service_name: serviceName,
      ...integration
    })

  if (error) {
    console.error('Error upserting user integration:', error)
    return false
  }

  return true
}

export async function disconnectUserIntegration(userId: string, serviceName: string): Promise<boolean> {
  if (!supabase || !userId) return false

  const { error } = await supabase
    .from('user_integrations')
    .update({ 
      is_connected: false,
      connection_data: null
    })
    .eq('user_id', userId)
    .eq('service_name', serviceName)

  if (error) {
    console.error('Error disconnecting user integration:', error)
    return false
  }

  return true
}

// User Security Settings Operations
export async function getUserSecuritySettings(userId: string): Promise<UserSecuritySettings | null> {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('user_security_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No security settings found, create default ones
      return await createUserSecuritySettings(userId)
    }
    console.error('Error fetching user security settings:', error)
    return null
  }

  return data
}

export async function createUserSecuritySettings(userId: string): Promise<UserSecuritySettings | null> {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('user_security_settings')
    .insert({
      user_id: userId,
      two_factor_enabled: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user security settings:', error)
    return null
  }

  return data
}

export async function updateUserSecuritySettings(userId: string, updates: Partial<UserSecuritySettings>): Promise<boolean> {
  if (!supabase || !userId) return false

  const { error } = await supabase
    .from('user_security_settings')
    .update(updates)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user security settings:', error)
    return false
  }

  return true
}

export async function getUserData(userId: string) {
  if (!userId) return null

  const [profile, preferences, integrations, securitySettings] = await Promise.all([
    getUserProfile(userId),
    getUserPreferences(userId),
    getUserIntegrations(userId),
    getUserSecuritySettings(userId)
  ])

  return {
    profile,
    preferences,
    integrations,
    securitySettings
  }
}