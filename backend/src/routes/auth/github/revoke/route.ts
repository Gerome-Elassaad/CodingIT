import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json()
    const supabase = createServerClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!access_token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 })
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
        return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } else {
      const errorText = await response.text()
      console.error('GitHub token revocation failed:', response.status, errorText)
      return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error revoking GitHub token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
