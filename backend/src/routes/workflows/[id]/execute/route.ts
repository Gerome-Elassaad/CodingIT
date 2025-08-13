import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { workflowPersistence } from '@/lib/workflow-persistence'
import { workflowEngine } from '@/lib/workflow-engine'

export const dynamic = 'force-dynamic'
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(true)
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { inputData = {}, triggerType = 'manual' } = body

    const workflow = await workflowPersistence.getWorkflow(params.id)
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const execution = await workflowEngine.executeWorkflow(
      workflow,
      inputData,
      triggerType
    )

    await workflowPersistence.createExecution(execution)

    return NextResponse.json({
      executionId: execution.id,
      status: execution.status,
      message: 'Workflow execution started'
    })
  } catch (error) {
    console.error('Error executing workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(true)
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const executionId = searchParams.get('execution_id')

    if (executionId) {
      const execution = await workflowPersistence.getExecution(executionId)
      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(execution)
    } else {
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')
      
      const result = await workflowPersistence.listExecutions(params.id, limit, offset)
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('Error fetching executions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
