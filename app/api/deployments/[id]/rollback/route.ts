import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { deploymentEngine } from '@/lib/deployment/deployment-engine'

export const dynamic = 'force-dynamic'

// POST /api/deployments/[id]/rollback - Rollback deployment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rolledBack = await deploymentEngine.rollbackDeployment(params.id)
    
    if (!rolledBack) {
      return NextResponse.json(
        { error: 'Deployment cannot be rolled back' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Deployment rolled back' })
  } catch (error) {
    console.error('Error rolling back deployment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}