import { NextResponse } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'

const E2B_API_KEY = process.env.E2B_API_KEY

const sandboxTimeout = 10 * 60 * 1000

async function getSandbox(sessionID: string, template?: string) {
  const sandbox = await Sandbox.create(template || 'code-interpreter-v1', {
    apiKey: E2B_API_KEY,
    metadata: {
      sessionID,
      template: template || 'code-interpreter-v1',
    },
    timeoutMs: sandboxTimeout,
  })
  return sandbox
}

export async function GET(req: Request) {
  try {
    if (!E2B_API_KEY) {
      return NextResponse.json(
        { error: 'E2B_API_KEY environment variable not found' },
        { status: 500 },
      )
    }

    const { searchParams } = new URL(req.url)
    const sessionID = searchParams.get('sessionID')
    const path = searchParams.get('path')
    const template = searchParams.get('template')

    if (!sessionID || !path) {
      return NextResponse.json(
        { error: 'sessionID and path are required' },
        { status: 400 },
      )
    }

    const sandbox = await getSandbox(sessionID, template || undefined)
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
    const { sessionID, path, content, template } = await req.json()

    if (!sessionID || !path || content === undefined) {
      return NextResponse.json(
        { error: 'sessionID, path and content are required' },
        { status: 400 },
      )
    }

    const sandbox = await getSandbox(sessionID, template || undefined)
    await sandbox.files.write(path, content)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
