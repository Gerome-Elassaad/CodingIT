import { NextRequest, NextResponse } from 'next/server'
import { Sandbox, FileType } from '@e2b/code-interpreter'
import { FileSystemNode } from '@/components/file-tree'

async function listFilesRecursively(
  sandbox: Sandbox,
  path: string,
): Promise<FileSystemNode[]> {
  const files = await sandbox.files.list(path)
  const nodes: FileSystemNode[] = []

  for (const file of files) {
    const fullPath = `${path}/${file.name}`
    if (file.type === FileType.DIR) {
      nodes.push({
        name: file.name,
        isDirectory: true,
        children: await listFilesRecursively(sandbox, fullPath),
      })
    } else {
      nodes.push({
        name: file.name,
        isDirectory: false,
        path: fullPath,
      })
    }
  }
  return nodes
}

const E2B_API_KEY = process.env.E2B_API_KEY

const sandboxTimeout = 10 * 60 * 1000

async function getSandbox(sessionID: string, template?: string) {
  if (!E2B_API_KEY) {
    throw new Error('E2B_API_KEY environment variable not found')
  }

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionID = searchParams.get('sessionID')
  const template = searchParams.get('template')

  if (!sessionID) {
    return NextResponse.json(
      { error: 'sessionID is required' },
      { status: 400 },
    )
  }

  try {
    const sandbox = await getSandbox(sessionID, template || undefined)
    const fileTree = await listFilesRecursively(sandbox, '/')
    return NextResponse.json(fileTree)
  } catch (error) {
    console.error('Error fetching file tree:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file tree' },
      { status: 500 },
    )
  }
}
