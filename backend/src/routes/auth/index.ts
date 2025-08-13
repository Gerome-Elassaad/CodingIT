import { Router } from 'express';
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase-server'
import { createPublicApiRoute } from '@/lib/api/middleware'
import { validateSearchParams } from '@/lib/api/validation'
import { 
  createErrorResponse, 
  createAuthenticationError, 
  handleDatabaseError,
  ApiException
} from '@/lib/api/errors'

const router = Router();

// Schema for GitHub OAuth callback
const githubCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code required'),
  state: z.string().min(1, 'State parameter required'),
  error: z.string().optional()
})

// GitHub OAuth callback - GET /api/auth/github
router.get('/github', async (req, res) => {
  try {
    const searchParams = validateSearchParams(new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`), githubCallbackSchema.partial())
    
    if (searchParams.error) {
      console.error('GitHub OAuth error:', searchParams.error)
      return res.redirect(
        `/settings/integrations?error=${encodeURIComponent('GitHub authentication failed')}`
      )
    }

    if (!searchParams.code || !searchParams.state) {
      return res.redirect(
        `/settings/integrations?error=${encodeURIComponent('Missing authorization code')}`
      )
    }

    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('User authentication failed:', authError)
      return res.redirect(
        `/settings/integrations?error=${encodeURIComponent('User not authenticated')}`
      )
    }

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

    return res.redirect('/settings/integrations?success=github_connected')

  } catch (error: any) {
    console.error('GitHub OAuth error:', {
      message: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    })

    const errorMessage = error instanceof ApiException 
      ? error.message 
      : 'Internal server error'

    return res.redirect(`/settings/integrations?error=${encodeURIComponent(errorMessage)}`)
  }
});

// GitHub token revocation - POST /api/auth/github/revoke
router.post('/github/revoke', async (req, res) => {
  try {
    const { access_token } = req.body
    const supabase = createServerClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' })
    }

    const response = await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64')}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token,
      }),
    })

    if (response.ok || response.status === 404) {
      const { error: dbError } = await supabase
        .from('user_integrations')
        .update({
          is_connected: false,
          connection_data: {},
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
        .eq('service_name', 'github')

      if (dbError) {
        console.error('Database error during revocation:', dbError)
        return res.status(500).json({ error: 'Failed to update database' })
      }

      return res.json({ success: true })
    } else {
      const errorText = await response.text()
      console.error('GitHub token revocation failed:', response.status, errorText)
      return res.status(500).json({ error: 'Failed to revoke token' })
    }
  } catch (error) {
    console.error('Error revoking GitHub token:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
});

// Helper functions
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

export const authRouter = router;