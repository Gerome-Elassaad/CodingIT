import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createPublicApiRoute } from '@/lib/api/middleware'
import { validateSearchParams } from '@/lib/api/validation'
import { 
  createErrorResponse, 
  createAuthenticationError, 
  handleDatabaseError,
  ApiException
} from '@/lib/api/errors'

// Force dynamic rendering for OAuth callback
export const dynamic = 'force-dynamic'

const githubCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code required'),
  state: z.string().min(1, 'State parameter required'),
  error: z.string().optional()
})

export const GET = createPublicApiRoute(
  async ({ request }) => {
    const searchParams = validateSearchParams(new URL(request.url), githubCallbackSchema.partial())
    
    if (searchParams.error) {
      console.error('GitHub OAuth error:', searchParams.error)
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('GitHub authentication failed')}`, request.url)
      )
    }

    if (!searchParams.code || !searchParams.state) {
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('Missing authorization code')}`, request.url)
      )
    }

    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('User authentication failed:', authError)
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('User not authenticated')}`, request.url)
      )
    }

    try {
      // Exchange code for access token
      const tokenData = await exchangeGitHubCode(searchParams.code, searchParams.state)
      
      // Fetch GitHub user information
      const githubUser = await fetchGitHubUser(tokenData.access_token)
      
      // Save integration to database
      await saveGitHubIntegration(supabase, user.id, tokenData, githubUser)
      
      // Setup webhooks (non-blocking)
      setupWebhooks(tokenData.access_token, githubUser.login).catch(error => {
        console.warn('Webhook setup failed:', error)
      })

      console.log('GitHub integration successful:', {
        userId: user.id,
        githubUsername: githubUser.login,
        githubUserId: githubUser.id
      })

      return NextResponse.redirect(
        new URL('/settings/integrations?success=github_connected', request.url)
      )

    } catch (error: any) {
      console.error('GitHub OAuth error:', {
        message: error?.message,
        userId: user?.id,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      })

      const errorMessage = error instanceof ApiException 
        ? error.message 
        : 'Internal server error'

      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
      )
    }
  },
  {
    security: { enableSecurityHeaders: true },
    validation: {
      environmentVars: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']
    }
  }
)

async function exchangeGitHubCode(code: string, state: string) {
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      state,
    }),
  })

  const tokenData = await tokenResponse.json()

  if (tokenData.error || !tokenData.access_token) {
    console.error('GitHub token exchange error:', tokenData.error)
    throw new ApiException(
      'Failed to exchange authorization code',
      tokenData.error_description
    )
  }

  return tokenData
}

async function fetchGitHubUser(accessToken: string) {
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  const githubUser = await userResponse.json()

  if (!userResponse.ok) {
    console.error('GitHub user fetch error:', githubUser)
    throw new ApiException(
      'Failed to fetch user information from GitHub',
      githubUser.message
    )
  }

  return githubUser
}

async function saveGitHubIntegration(supabase: any, userId: string, tokenData: any, githubUser: any) {
  const { error: dbError } = await supabase
    .from('user_integrations')
    .upsert({
      user_id: userId,
      service_name: 'github',
      is_connected: true,
      connection_data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
        github_user_id: githubUser.id,
        username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        connected_at: new Date().toISOString(),
      },
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (dbError) {
    console.error('Database error saving GitHub integration:', dbError)
    throw handleDatabaseError(dbError)
  }
}

async function setupWebhooks(accessToken: string, _username: string) {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/github`
  
  const reposResponse = await fetch(`https://api.github.com/user/repos?type=owner&per_page=10`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (reposResponse.ok) {
    const repos = await reposResponse.json()
    
    for (const repo of repos.slice(0, 3)) {
      try {
        await fetch(`https://api.github.com/repos/${repo.full_name}/hooks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'web',
            active: true,
            events: ['push', 'pull_request', 'issues'],
            config: {
              url: webhookUrl,
              content_type: 'json',
              insecure_ssl: '0',
              secret: process.env.GITHUB_WEBHOOK_SECRET,
            },
          }),
        })
      } catch (error) {
        console.warn(`Failed to setup webhook for ${repo.full_name}:`, error)
      }
    }
  }
}
