import { NextResponse } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'
import { createProtectedApiRoute, type MiddlewareContext } from '@/lib/api/middleware'
import { validateJsonBody } from '@/lib/api/validation'
import { createErrorResponse, ApiException } from '@/lib/api/errors'
import { z } from 'zod'

const E2B_API_KEY = process.env.E2B_API_KEY

const batchFileSchema = z.object({
  sandboxId: z.string(),
  files: z.array(z.object({
    file_path: z.string(),
    file_content: z.string(),
  })),
})

async function ensureDirectoryExists(sandbox: Sandbox, filePath: string) {
  const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
  if (dirPath && dirPath !== '') {
    try {
      await sandbox.files.makeDir(dirPath)
    } catch (error) {
      // Directory might already exist, continue
    }
  }
}

export const POST = createProtectedApiRoute(
  async ({ request }: MiddlewareContext) => {
    if (!E2B_API_KEY) {
      return createErrorResponse(new ApiException(
        'E2B_API_KEY environment variable not found',
        'configuration_error' as any,
        500
      ))
    }

    try {
      const { sandboxId, files } = await validateJsonBody(request, batchFileSchema)

      const sandbox = await Sandbox.connect(sandboxId, {
        apiKey: E2B_API_KEY,
      })

      const results = []
      for (const file of files) {
        try {
          await ensureDirectoryExists(sandbox, file.file_path)
          await sandbox.files.write(file.file_path, file.file_content)
          results.push({
            path: file.file_path,
            success: true,
            size: file.file_content.length
          })
        } catch (error: any) {
          results.push({
            path: file.file_path,
            success: false,
            error: error.message
          })
        }
      }

      await sandbox.kill()
      return NextResponse.json({ 
        success: true, 
        files: results,
        totalFiles: files.length,
        successCount: results.filter(r => r.success).length
      })

    } catch (error: any) {
      console.error('Batch file creation error:', {
        message: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      })

      return createErrorResponse(new ApiException(
        error.message || 'Failed to create files',
        'operation_error' as any,
        500
      ))
    }
  },
  {
    security: { enableSecurityHeaders: true },
    validation: {
      maxBodySize: 5 * 1024 * 1024 // 5MB for multiple files
    }
  }
)