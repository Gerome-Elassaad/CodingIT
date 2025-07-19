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

export async function GET(request: NextRequest) {
  try {
    if (!E2B_API_KEY) {
      return NextResponse.json(
        { error: 'E2B_API_KEY environment variable not found' },
        { status: 500 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const sandboxId = searchParams.get('sandboxId')

    if (!sandboxId) {
      return NextResponse.json(
        { error: 'sandboxId is required' },
        { status: 400 },
      )
    }

    // Connect to existing sandbox by ID
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: E2B_API_KEY,
    })

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