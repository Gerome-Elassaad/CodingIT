import { NextResponse } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'

const E2B_API_KEY = process.env.E2B_API_KEY

const sandboxTimeout = 10 * 60 * 1000

export async function GET(req: Request) {
  try {
    if (!E2B_API_KEY) {
      return NextResponse.json(
        { error: 'E2B_API_KEY environment variable not found' },
        { status: 500 },
      )
    }

    const { searchParams } = new URL(req.url)
    const sandboxId = searchParams.get('sandboxId')
    const path = searchParams.get('path')

    if (!sandboxId || !path) {
      return NextResponse.json(
        { error: 'sandboxId and path are required' },
        { status: 400 },
      )
    }

    // Connect to existing sandbox by ID
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: E2B_API_KEY,
    })

    const content = await sandbox.files.read(path)
    return NextResponse.json({ content })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const { sandboxId, path, content } = await req.json()

    if (!sandboxId || !path || content === undefined) {
      return NextResponse.json(
        { error: 'sandboxId, path and content are required' },
        { status: 400 },
      )
    }

    // Connect to existing sandbox by ID
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: E2B_API_KEY,
    })

    await sandbox.files.write(path, content)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}