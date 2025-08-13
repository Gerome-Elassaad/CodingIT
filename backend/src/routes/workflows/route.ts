import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { workflowPersistence } from '@/lib/workflow-persistence'
import { workflowEngine } from '@/lib/workflow-engine'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(true)
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const teamId = searchParams.get('team_id') || session.user.id

    const result = await workflowPersistence.listWorkflows(teamId, limit, offset)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(true)
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, fragments, connections, variables, triggers } = body

    if (!name || !fragments) {
      return NextResponse.json(
        { error: 'Name and fragments are required' },
        { status: 400 }
      )
    }

    const workflow = await workflowPersistence.createWorkflow(
      {
        name,
        description,
        fragments: fragments || [],
        connections: connections || [],
        variables: variables || [],
        triggers: triggers || [],
        version: 1
      },
      session.user.id
    )

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
