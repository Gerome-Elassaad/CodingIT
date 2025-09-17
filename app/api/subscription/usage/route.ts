import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { stripe as stripeClient } from '@/lib/stripe'
import Stripe from 'stripe'

export async function GET() {
  const supabase = createServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!stripeClient) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { data: usersTeamsData, error: usersTeamsError } = await supabase
    .from('users_teams')
    .select('teams (stripe_customer_id)')
    .eq('user_id', user.id)
    .eq('is_default', true)

  if (usersTeamsError) {
    console.error('Error fetching user team:', usersTeamsError)
    return NextResponse.json(
      { error: 'Failed to fetch user team data' },
      { status: 500 }
    )
  }

  const teamData = usersTeamsData?.[0]
  const customerId = (teamData?.teams as any)?.stripe_customer_id

  if (!customerId) {
    return NextResponse.json({ usage: [] })
  }

  try {
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price'],
    })

    if (!subscriptions.data.length) {
      return NextResponse.json({ usage: [] })
    }

    const subscription = subscriptions.data[0]
    const usage = subscription.items.data
      .filter((item: Stripe.SubscriptionItem) => item.price)
      .map((item: Stripe.SubscriptionItem) => {
        const price = item.price as Stripe.Price

        return {
          id: item.id,
          quantity: item.quantity,
          price: {
            id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            product: price.product
          }
        }
      })

    return NextResponse.json({ usage })
  } catch (error) {
    console.error('Error fetching Stripe subscription usage:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription usage' }, { status: 500 })
  }
}
