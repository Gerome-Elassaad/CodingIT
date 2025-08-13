import { nanoid } from 'nanoid'
import { API_BASE_URL } from '@/lib/config'

export interface GitHubOAuthConfig {
  clientId: string
  redirectUri: string
  scopes: string[]
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  ssh_url: string
  private: boolean
  fork: boolean
  archived: boolean
  disabled: boolean
  owner: {
    login: string
    avatar_url: string
    type: string
  }
  created_at: string
  updated_at: string
  pushed_at: string
  language: string | null
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  size: number
  default_branch: string
  topics: string[]
  has_issues: boolean
  has_projects: boolean
  has_wiki: boolean
  has_pages: boolean
  has_downloads: boolean
  license: {
    key: string
    name: string
    spdx_id: string
  } | null
}

export interface GitHubUserIntegration {
  access_token: string
  refresh_token?: string
  token_type: string
  scope: string
  github_user_id: number
  username: string
  avatar_url: string
  connected_at: string
  last_webhook_event?: {
    type: string
    repository?: string
    branch?: string
    commits?: number
    action?: string
    pr_number?: number
    pr_title?: string
    issue_number?: number
    issue_title?: string
    timestamp: string
    author?: string
    pusher?: string
  }
}

export function generateGitHubOAuthUrl(config: GitHubOAuthConfig): string {
  const state = nanoid()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    allow_signup: 'true',
  })

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('github_oauth_state', state)
  }

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

export function getGitHubScopes(): string[] {
  return [
    'user:email',
    'repo',
    'write:repo_hook',
    'read:org',
  ]
}

export async function revokeGitHubToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/github/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error revoking GitHub token:', error)
    return false
  }
}

export async function fetchGitHubRepositories(options?: {
  page?: number
  per_page?: number
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  type?: 'all' | 'owner' | 'public' | 'private' | 'member'
}): Promise<{ repositories: GitHubRepository[]; total_count: number; has_more: boolean } | null> {
  try {
    const params = new URLSearchParams()
    if (options?.page) params.append('page', options.page.toString())
    if (options?.per_page) params.append('per_page', options.per_page.toString())
    if (options?.sort) params.append('sort', options.sort)
    if (options?.type) params.append('type', options.type)

    const response = await fetch(`${API_BASE_URL}/api/integrations/github/repos?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error)
    return null
  }
}

export function isGitHubIntegrationHealthy(integration: any): boolean {
  if (!integration?.is_connected) return false
  if (!integration?.connection_data?.access_token) return false
  
  if (integration.last_sync_at) {
    const lastSync = new Date(integration.last_sync_at)
    const now = new Date()
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceSync > 24) {
      return false
    }
  }
  
  return true
}

export function formatGitHubWebhookEvent(event: any): string {
  if (!event) return 'No recent activity'

  switch (event.type) {
    case 'push':
      return `${event.commits} commit(s) pushed to ${event.branch} in ${event.repository}`
    case 'pull_request':
      return `Pull request #${event.pr_number} ${event.action} in ${event.repository}`
    case 'issues':
      return `Issue #${event.issue_number} ${event.action} in ${event.repository}`
    default:
      return `${event.type} event in ${event.repository || 'repository'}`
  }
}

export function getGitHubEventIcon(eventType: string): string {
  switch (eventType) {
    case 'push':
      return '📤'
    case 'pull_request':
      return '🔀'
    case 'issues':
      return '❗'
    default:
      return '📋'
  }
}

export function validateGitHubWebhookSignature(body: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false

  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return signature === `sha256=${expectedSignature}`
}