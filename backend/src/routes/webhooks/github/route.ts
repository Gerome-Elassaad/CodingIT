import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    const event = request.headers.get('x-github-event')
    const delivery = request.headers.get('x-github-delivery')

    if (!verifySignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    console.log(`GitHub webhook received: ${event} (delivery: ${delivery})`)

    switch (event) {
      case 'push':
        await handlePushEvent(payload)
        break
      case 'pull_request':
        await handlePullRequestEvent(payload)
        break
      case 'issues':
        await handleIssuesEvent(payload)
        break
      case 'ping':
        console.log('GitHub webhook ping received')
        break
      default:
        console.log(`Unhandled GitHub event: ${event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('GitHub webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  return signature === `sha256=${expectedSignature}`
}

async function handlePushEvent(payload: any) {
  const supabase = createServerClient()

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('user_id, connection_data')
    .eq('service_name', 'github')
    .eq('connection_data->username', payload.repository.owner.login)
    .single()

  if (integration) {
    const currentData = integration.connection_data || {}
    
    await supabase
      .from('user_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        connection_data: {
          ...currentData,
          last_webhook_event: {
            type: 'push',
            repository: payload.repository.full_name,
            branch: payload.ref.replace('refs/heads/', ''),
            commits: payload.commits.length,
            timestamp: new Date().toISOString(),
            pusher: payload.pusher.name,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', integration.user_id)
      .eq('service_name', 'github')

    console.log(`Push event processed for user ${integration.user_id}`)
  }
}

async function handlePullRequestEvent(payload: any) {
  const supabase = createServerClient()

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('user_id, connection_data')
    .eq('service_name', 'github')
    .eq('connection_data->username', payload.repository.owner.login)
    .single()

  if (integration) {
    const currentData = integration.connection_data || {}
    
    await supabase
      .from('user_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        connection_data: {
          ...currentData,
          last_webhook_event: {
            type: 'pull_request',
            action: payload.action,
            repository: payload.repository.full_name,
            pr_number: payload.pull_request.number,
            pr_title: payload.pull_request.title,
            timestamp: new Date().toISOString(),
            author: payload.pull_request.user.login,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', integration.user_id)
      .eq('service_name', 'github')

    console.log(`Pull request ${payload.action} processed for user ${integration.user_id}`)
  }
}

async function handleIssuesEvent(payload: any) {
  const supabase = createServerClient()

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('user_id, connection_data')
    .eq('service_name', 'github')
    .eq('connection_data->username', payload.repository.owner.login)
    .single()

  if (integration) {
    const currentData = integration.connection_data || {}
    
    await supabase
      .from('user_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        connection_data: {
          ...currentData,
          last_webhook_event: {
            type: 'issues',
            action: payload.action,
            repository: payload.repository.full_name,
            issue_number: payload.issue.number,
            issue_title: payload.issue.title,
            timestamp: new Date().toISOString(),
            author: payload.issue.user.login,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', integration.user_id)
      .eq('service_name', 'github')

    console.log(`Issue ${payload.action} processed for user ${integration.user_id}`)
  }
}
