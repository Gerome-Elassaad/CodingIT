import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { checkFeatureAccess } from '@/lib/usage-tracker'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: integration } = await supabase
      .from('user_integrations')
      .select('connection_data')
      .eq('user_id', session.user.id)
      .eq('service_name', 'github')
      .eq('is_connected', true)
      .single()

    if (!integration?.connection_data?.access_token) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page') || '1'
    const per_page = searchParams.get('per_page') || '30'
    const sort = searchParams.get('sort') || 'updated'
    const type = searchParams.get('type') || 'all'

    const response = await fetch(`https://api.github.com/user/repos?sort=${sort}&type=${type}&page=${page}&per_page=${per_page}`, {
      headers: {
        'Authorization': `Bearer ${integration.connection_data.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodingIT-App/1.0',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('GitHub API error:', errorData)
      
      if (response.status === 401) {
        await supabase
          .from('user_integrations')
          .update({
            is_connected: false,
            connection_data: {},
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id)
          .eq('service_name', 'github')
        
        return NextResponse.json({ error: 'GitHub token expired' }, { status: 401 })
      }
      
      return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
    }

    const repos = await response.json()
    
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      private: repo.private,
      fork: repo.fork,
      archived: repo.archived,
      disabled: repo.disabled,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        type: repo.owner.type,
      },
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      watchers_count: repo.watchers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      size: repo.size,
      default_branch: repo.default_branch,
      topics: repo.topics || [],
      has_issues: repo.has_issues,
      has_projects: repo.has_projects,
      has_wiki: repo.has_wiki,
      has_pages: repo.has_pages,
      has_downloads: repo.has_downloads,
      license: repo.license ? {
        key: repo.license.key,
        name: repo.license.name,
        spdx_id: repo.license.spdx_id,
      } : null,
    }))

    await supabase
      .from('user_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('service_name', 'github')

    // Get GitHub import usage limits
    const usageInfo = await checkFeatureAccess(session.user.id, 'github_imports')

    return NextResponse.json({ 
      repositories: formattedRepos,
      total_count: repos.length,
      has_more: repos.length === parseInt(per_page),
      usage_limits: {
        can_import: usageInfo.canUse,
        current_usage: usageInfo.currentUsage,
        limit: usageInfo.limit,
        is_unlimited: usageInfo.isUnlimited,
        plan_name: usageInfo.planName,
        upgrade_required: usageInfo.upgradeRequired
      }
    })
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
