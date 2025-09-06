import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase-client'
import { createHash } from 'crypto'

const browserSupabase = supabase

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_hash: string
  key_prefix: string
  permissions: string[]
  last_used_at?: string
  expires_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ApiKeyPermission = 
  | 'chat:read' 
  | 'chat:write' 
  | 'projects:read' 
  | 'projects:write' 
  | 'files:read' 
  | 'files:write'
  | 'sandboxes:create'
  | 'sandboxes:execute'

// =============================================
// API KEY OPERATIONS (Uses idx_api_keys_user_id index)
// =============================================

export async function getUserApiKeys(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string
): Promise<Omit<ApiKey, 'key_hash'>[]> {
  if (!supabase || !userId) return []

  try {
    // Uses idx_api_keys_user_id index
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        user_id,
        name,
        key_prefix,
        permissions,
        last_used_at,
        expires_at,
        is_active,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return []
  }
}

export async function getActiveApiKeys(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string
): Promise<Omit<ApiKey, 'key_hash'>[]> {
  if (!supabase || !userId) return []

  try {
    // Uses idx_api_keys_user_id index
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        user_id,
        name,
        key_prefix,
        permissions,
        last_used_at,
        expires_at,
        is_active,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Filter out expired keys
    const now = new Date()
    return (data || []).filter(key => 
      !key.expires_at || new Date(key.expires_at) > now
    )
  } catch (error) {
    console.error('Error fetching active API keys:', error)
    return []
  }
}

export async function validateApiKey(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  apiKey: string
): Promise<{ valid: boolean; userId?: string; permissions?: string[] }> {
  if (!supabase || !apiKey) {
    return { valid: false }
  }

  try {
    const keyHash = createHash('sha256').update(apiKey).digest('hex')

    // Find the API key by hash (note: we might want to add an index on key_hash for performance)
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id, permissions, expires_at, is_active')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return { valid: false }
    }

    // Check if key is expired
    if (data.expires_at && new Date(data.expires_at) <= new Date()) {
      return { valid: false }
    }

    // Update last_used_at (uses idx_api_keys_user_id index)
    await supabase
      .from('api_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('key_hash', keyHash)

    return {
      valid: true,
      userId: data.user_id,
      permissions: data.permissions
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return { valid: false }
  }
}

export async function createApiKey(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  name: string,
  permissions: ApiKeyPermission[],
  expiresInDays?: number
): Promise<{ success: boolean; apiKey?: string; keyRecord?: Omit<ApiKey, 'key_hash'> }> {
  if (!supabase || !userId || !name || !permissions.length) {
    return { success: false }
  }

  try {
    // Generate API key
    const apiKey = `codinit_${generateRandomString(32)}`
    const keyHash = createHash('sha256').update(apiKey).digest('hex')
    const keyPrefix = apiKey.substring(0, 12) + '...'

    // Calculate expiration
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      const expiration = new Date()
      expiration.setDate(expiration.getDate() + expiresInDays)
      expiresAt = expiration.toISOString()
    }

    // Uses idx_api_keys_user_id index
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        expires_at: expiresAt,
        is_active: true
      })
      .select(`
        id,
        user_id,
        name,
        key_prefix,
        permissions,
        expires_at,
        is_active,
        created_at,
        updated_at
      `)
      .single()

    if (error) throw error

    return {
      success: true,
      apiKey,
      keyRecord: data
    }
  } catch (error) {
    console.error('Error creating API key:', error)
    return { success: false }
  }
}

export async function updateApiKey(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  keyId: string,
  userId: string,
  updates: Partial<Pick<ApiKey, 'name' | 'permissions' | 'is_active'>>
): Promise<boolean> {
  if (!supabase || !keyId || !userId) return false

  try {
    // Uses idx_api_keys_user_id index for security
    const { error } = await supabase
      .from('api_keys')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating API key:', error)
    return false
  }
}

export async function deleteApiKey(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  keyId: string,
  userId: string
): Promise<boolean> {
  if (!supabase || !keyId || !userId) return false

  try {
    // Uses idx_api_keys_user_id index for security
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting API key:', error)
    return false
  }
}

export async function revokeApiKey(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  keyId: string,
  userId: string
): Promise<boolean> {
  return updateApiKey(supabase, keyId, userId, { is_active: false })
}

export async function getApiKeyUsageStats(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string
): Promise<{
  totalKeys: number
  activeKeys: number
  expiredKeys: number
  lastUsed?: string
}> {
  if (!supabase || !userId) {
    return { totalKeys: 0, activeKeys: 0, expiredKeys: 0 }
  }

  try {
    // Uses idx_api_keys_user_id index
    const { data, error } = await supabase
      .from('api_keys')
      .select('is_active, expires_at, last_used_at')
      .eq('user_id', userId)

    if (error) throw error

    const keys = data || []
    const now = new Date()
    
    const totalKeys = keys.length
    const activeKeys = keys.filter(key => 
      key.is_active && (!key.expires_at || new Date(key.expires_at) > now)
    ).length
    const expiredKeys = keys.filter(key => 
      key.expires_at && new Date(key.expires_at) <= now
    ).length

    // Find most recent usage
    const lastUsed = keys
      .filter(key => key.last_used_at)
      .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())[0]?.last_used_at

    return { totalKeys, activeKeys, expiredKeys, lastUsed }
  } catch (error) {
    console.error('Error fetching API key stats:', error)
    return { totalKeys: 0, activeKeys: 0, expiredKeys: 0 }
  }
}

// =============================================
// PERMISSION HELPERS
// =============================================

export function hasPermission(permissions: string[], required: ApiKeyPermission): boolean {
  return permissions.includes(required) || permissions.includes('*')
}

export function validatePermissions(permissions: string[]): boolean {
  const validPermissions: ApiKeyPermission[] = [
    'chat:read', 'chat:write', 'projects:read', 'projects:write',
    'files:read', 'files:write', 'sandboxes:create', 'sandboxes:execute'
  ]
  
  return permissions.every(perm => 
    perm === '*' || validPermissions.includes(perm as ApiKeyPermission)
  )
}

export function getPermissionDescription(permission: string): string {
  const descriptions: { [key: string]: string } = {
    '*': 'Full access to all resources',
    'chat:read': 'Read chat messages and sessions',
    'chat:write': 'Send chat messages and create sessions',
    'projects:read': 'View projects and their contents',
    'projects:write': 'Create, update, and delete projects',
    'files:read': 'View uploaded files',
    'files:write': 'Upload, update, and delete files',
    'sandboxes:create': 'Create new sandboxes',
    'sandboxes:execute': 'Execute code in sandboxes'
  }
  
  return descriptions[permission] || 'Unknown permission'
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatApiKey(apiKey: string): string {
  if (apiKey.length <= 16) return apiKey
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
}

export function isApiKeyExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) <= new Date()
}

export function getTimeUntilExpiry(expiresAt?: string): string {
  if (!expiresAt) return 'Never'
  
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()
  
  if (diff <= 0) return 'Expired'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days} day${days === 1 ? '' : 's'}`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}`
  return 'Less than 1 hour'
}
