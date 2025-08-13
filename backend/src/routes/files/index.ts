import { Router } from 'express';
import { Sandbox, FileType } from '@e2b/code-interpreter'
import { FileSystemNode } from '@/components/file-tree'

const router = Router();

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

// Get file tree - GET /api/files
router.get('/', async (req, res) => {
  const sessionID = req.query.sessionID as string
  const template = req.query.template as string

  if (!sessionID) {
    return res.status(400).json({
      error: 'sessionID is required'
    });
  }

  try {
    const sandbox = await getSandbox(sessionID, template || undefined)
    const fileTree = await listFilesRecursively(sandbox, '/')
    return res.json(fileTree)
  } catch (error) {
    console.error('Error fetching file tree:', error)
    return res.status(500).json({
      error: 'Failed to fetch file tree'
    });
  }
});

export const filesRouter = router;