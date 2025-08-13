import { createServerClient } from '@/lib/supabase-server'
import { createAuthenticationError, createAuthorizationError, ApiException } from './errors'
import type { User } from '@supabase/supabase-js'

export interface AuthenticatedUser {
  user: User
  teamId?: string
  isTeamMember: boolean
}

export interface TeamMember {
  user_id: string
  team_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export async function validateAuthentication(request: Request): Promise<AuthenticatedUser> {
  const supabase = createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw createAuthenticationError('User not authenticated')
  }

  return {
    user,
    teamId: undefined,
    isTeamMember: false
  }
}

export async function validateTeamAccess(
  request: Request,
  requiredTeamId?: string
): Promise<AuthenticatedUser> {
  const { user } = await validateAuthentication(request)
  
  if (!requiredTeamId) {
    return {
      user,
      teamId: undefined,
      isTeamMember: false
    }
  }

  const supabase = createServerClient()
  
  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('team_id', requiredTeamId)
    .single()

  if (error || !teamMember) {
    throw createAuthorizationError('Access denied to this team')
  }

  return {
    user,
    teamId: requiredTeamId,
    isTeamMember: true
  }
}

export async function validateTeamRole(
  request: Request,
  teamId: string,
  requiredRoles: ('owner' | 'admin' | 'member')[] = ['member']
): Promise<AuthenticatedUser> {
  const authResult = await validateTeamAccess(request, teamId)
  
  const supabase = createServerClient()
  
  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', authResult.user.id)
    .eq('team_id', teamId)
    .single()

  if (error || !teamMember || !requiredRoles.includes(teamMember.role)) {
    throw createAuthorizationError(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`)
  }

  return authResult
}

export async function getGitHubToken(userId: string): Promise<string> {
  const supabase = createServerClient()
  
  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('connection_data')
    .eq('user_id', userId)
    .eq('service_name', 'github')
    .eq('is_connected', true)
    .single()

  if (error || !integration?.connection_data?.access_token) {
    throw createAuthenticationError('GitHub integration not found or invalid')
  }

  return integration.connection_data.access_token
}

export async function refreshGitHubToken(userId: string): Promise<string> {
  const supabase = createServerClient()
  
  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('connection_data')
    .eq('user_id', userId)
    .eq('service_name', 'github')
    .eq('is_connected', true)
    .single()

  if (error || !integration?.connection_data?.refresh_token) {
    throw createAuthenticationError('GitHub refresh token not available')
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        refresh_token: integration.connection_data.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = await response.json()

    if (tokenData.error || !tokenData.access_token) {
      throw new Error('Token refresh failed')
    }

    // Update the stored tokens
    await supabase
      .from('user_integrations')
      .update({
        connection_data: {
          ...integration.connection_data,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || integration.connection_data.refresh_token,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('service_name', 'github')

    return tokenData.access_token
  } catch (error) {
    throw createAuthenticationError('Failed to refresh GitHub token')
  }
}

export async function validateApiKey(apiKey: string, provider: string): Promise<boolean> {
  if (!apiKey) return false
  
  // Basic validation - check if it's not empty and has reasonable length
  if (apiKey.length < 10) return false
  
  // Provider-specific validation patterns
  const patterns: Record<string, RegExp> = {
    openai: /^sk-[A-Za-z0-9]{48}$/,
    anthropic: /^sk-ant-[A-Za-z0-9\-_]{95}$/,
    google: /^[A-Za-z0-9\-_]{39}$/,
    mistral: /^[A-Za-z0-9]{32}$/,
  }
  
  if (patterns[provider]) {
    return patterns[provider].test(apiKey)
  }
  
  // For unknown providers, just check it's not empty
  return true
}

export async function validateRequest(
  request: Request,
  options: {
    requireAuth?: boolean
    requireTeam?: string
    requireRole?: ('owner' | 'admin' | 'member')[]
    requireGitHub?: boolean
  } = {}
): Promise<AuthenticatedUser | null> {
  try {
    let authResult: AuthenticatedUser | null = null

    if (options.requireAuth || options.requireTeam || options.requireRole || options.requireGitHub) {
      if (options.requireTeam && options.requireRole) {
        authResult = await validateTeamRole(request, options.requireTeam, options.requireRole)
      } else if (options.requireTeam) {
        authResult = await validateTeamAccess(request, options.requireTeam)
      } else {
        authResult = await validateAuthentication(request)
      }

      if (options.requireGitHub && authResult) {
        // Validate GitHub integration exists
        await getGitHubToken(authResult.user.id)
      }
    }

    return authResult
  } catch (error) {
    if (error instanceof ApiException) {
      throw error
    }
    throw createAuthenticationError('Authentication validation failed')
  }
}