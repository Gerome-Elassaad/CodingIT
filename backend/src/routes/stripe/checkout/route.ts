import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createCheckoutSession } from '@/lib/subscription'
import { STRIPE_PLANS, stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planType } = body

    if (!planType || !STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]
    
    if (!plan.priceId) {
      return NextResponse.json({ error: 'Plan not available for checkout' }, { status: 400 })
    }

    // Get user's default team
    const { data: userTeam } = await supabase
      .from('users_teams')
      .select('teams (id, name, email)')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (!userTeam?.teams) {
      return NextResponse.json({ error: 'No default team found' }, { status: 400 })
    }

    const team = userTeam.teams as any
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    
    const checkoutUrl = await createCheckoutSession(
      team.id,
      plan.priceId,
      `${origin}/settings/billing?success=true`,
      `${origin}/settings/billing?canceled=true`
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}