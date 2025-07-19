import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { deploymentEngine } from '@/lib/deployment/deployment-engine'
import { FragmentSchema } from '@/lib/schema'

export const dynamic = 'force-dynamic'

// POST /api/deployments - Deploy fragment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fragment, config } = body

    if (!fragment || !config) {
      return NextResponse.json(
        { error: 'Fragment and config are required' },
        { status: 400 }
      )
    }

    // Validate fragment schema
    const fragmentData = fragment as FragmentSchema
    if (!fragmentData.template || !fragmentData.code) {
      return NextResponse.json(
        { error: 'Fragment must have template and code' },
        { status: 400 }
      )
    }

    // Start deployment in background
    const deploymentResult = await deploymentEngine.deployFragment(fragmentData, config)

    return NextResponse.json(deploymentResult)
  } catch (error) {
    console.error('Error deploying fragment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/deployments - List deployments
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const fragmentId = searchParams.get('fragment_id')

    if (fragmentId) {
      const history = deploymentEngine.getDeploymentHistory(fragmentId)
      return NextResponse.json({ deployments: history })
    }

    // For now, return empty array since we don't have user-specific deployment tracking
    return NextResponse.json({ deployments: [] })
  } catch (error) {
    console.error('Error listing deployments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}