import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getTeamUsageLimits, getTeamSubscription } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's default team
    const { data: userTeam, error: teamError } = await supabase
      .from('users_teams')
      .select('teams (id)')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (teamError || !userTeam?.teams) {
      console.error('Team lookup failed for user:', user.id, teamError)
      return NextResponse.json({ error: 'No default team found' }, { status: 400 })
    }

    const team = userTeam.teams as any
    
    const [subscription, usageLimits] = await Promise.all([
      getTeamSubscription(team.id),
      getTeamUsageLimits(team.id)
    ])

    return NextResponse.json({
      subscription,
      usage_limits: usageLimits
    })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}