import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createPortalSession } from '@/lib/subscription'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's default team
    const { data: userTeam } = await supabase
      .from('users_teams')
      .select('teams (id, stripe_customer_id)')
      .eq('user_id', session.user.id)
      .eq('is_default', true)
      .single()

    if (!userTeam?.teams) {
      return NextResponse.json({ error: 'No default team found' }, { status: 400 })
    }

    const team = userTeam.teams as any
    
    if (!team.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    
    const portalUrl = await createPortalSession(
      team.id,
      `${origin}/settings/billing`
    )

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}