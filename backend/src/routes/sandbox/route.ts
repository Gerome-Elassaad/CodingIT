import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'
import { createRateLimitedApiRoute } from '@/lib/api/middleware'
import { validateJsonBody, commonSchemas } from '@/lib/api/validation'
import { 
  handleE2BError, 
  createErrorResponse, 
  createValidationError, 
  createConfigError,
  ApiException
} from '@/lib/api/errors'
import { createSuccessResponse } from '@/lib/api/response-utils'

const sandboxTimeout = 10 * 60 * 1000

export const maxDuration = 60

export const POST = createRateLimitedApiRoute(
  async ({ request }) => {
    const {
      fragment,
      userID,
      teamID,
      accessToken,
    } = await validateJsonBody(request, commonSchemas.sandboxRequest)

    if (!process.env.E2B_API_KEY) {
      console.error('E2B_API_KEY environment variable not found')
      throw createConfigError('Code execution service is not configured. Please check environment settings.')
    }

    let sbx: Sandbox | undefined

    try {
      // Create sandbox
      try {
        sbx = await Sandbox.create(fragment.template, {
          metadata: {
            template: fragment.template,
            userID: userID ?? '',
            teamID: teamID ?? '',
          },
          timeoutMs: sandboxTimeout,
          ...(teamID && accessToken
            ? {
                headers: {
                  'X-Supabase-Team': teamID,
                  'X-Supabase-Token': accessToken,
                },
              }
            : {}),
        })

        console.log('Sandbox created:', {
          sandboxId: sbx.sandboxId,
          template: fragment.template,
          userID,
          teamID
        })
      } catch (e2bError: any) {
        console.error('E2B Sandbox creation failed:', e2bError)
        throw handleE2BError(e2bError)
      }

      // Install dependencies if needed
      if (fragment.has_additional_dependencies && fragment.install_dependencies_command) {
        try {
          await sbx.commands.run(fragment.install_dependencies_command)
        } catch (dependencyError: any) {
          console.error('Dependency installation failed:', dependencyError)
          throw new ApiException(
            'Failed to install additional dependencies',
            'execution_error' as any,
            500,
            dependencyError.message
          )
        }
      }

      // Write code files
      try {
        // Always write main file first (existing behavior)
        if (fragment.code && typeof fragment.code === 'string') {
          const filePath: string = fragment.file_path || 'main.py'
          await sbx.files.write(filePath, fragment.code)
        }
        // Handle legacy array format for existing compatibility
        else if (fragment.code && Array.isArray(fragment.code)) {
          await Promise.all(fragment.code.map(async (file) => {
            const filePath = file.file_path || `file_${Math.random().toString(36).substring(2, 9)}.py`
            await sbx!.files.write(filePath, file.file_content)
          }))
        }
        
        // NEW: Handle additional files for multi-file projects (additive feature)
        if (fragment.is_multi_file && fragment.files && fragment.files.length > 0) {
          console.log('Creating additional files for multi-file project:', fragment.files.length)
          
          for (const file of fragment.files) {
            // Create directory if needed
            const dirPath = file.file_path.substring(0, file.file_path.lastIndexOf('/'))
            if (dirPath && dirPath !== '') {
              try {
                await sbx.files.makeDir(dirPath)
              } catch (dirError) {
                // Directory might already exist, continue
                console.warn('Directory creation warning:', dirError)
              }
            }
            
            // Write the file
            await sbx.files.write(file.file_path, file.file_content)
          }
          
          console.log('Multi-file project created successfully:', {
            mainFile: fragment.file_path,
            additionalFiles: fragment.files.length,
            totalFiles: 1 + fragment.files.length
          })
        }
        
        // Ensure we have at least some code
        if (!fragment.code && (!fragment.files || fragment.files.length === 0)) {
          throw createValidationError('Missing code data')
        }
      } catch (fileError: any) {
        console.error('File write error:', fileError)
        if (fileError instanceof ApiException) throw fileError
        throw new ApiException(
          'Failed to write code files to sandbox',
          'execution_error' as any,
          500,
          fileError.message
        )
      }

      // Execute code based on template type
      if (fragment.template === 'code-interpreter-v1') {
        try {
          const codeToRun = Array.isArray(fragment.code) ? '' : (fragment.code || '')
          const { logs, error, results } = await sbx.runCode(codeToRun)

          const response: ExecutionResultInterpreter = {
            sbxId: sbx.sandboxId,
            template: fragment.template,
            stdout: logs.stdout,
            stderr: logs.stderr,
            runtimeError: error,
            cellResults: results,
          }

          return createSuccessResponse(response)
        } catch (codeError: any) {
          console.error('Code execution error:', codeError)
          throw new ApiException(
            'Code execution failed. There may be an error in your code.',
            'execution_error' as any,
            500,
            codeError.message
          )
        }
      }

      // For web applications, start the server
      try {
        if (fragment.install_dependencies_command) {
          await sbx.commands.run(fragment.install_dependencies_command, {
            envs: {
              PORT: (fragment.port || 80).toString(),
            },
          })
        }

        const response: ExecutionResultWeb = {
          sbxId: sbx.sandboxId,
          template: fragment.template as any,
          url: `https://${sbx.getHost(fragment.port || 80)}`,
        }

        return createSuccessResponse(response)
      } catch (serverError: any) {
        console.error('Server startup error:', serverError)
        throw new ApiException(
          'Failed to start the application server',
          'execution_error' as any,
          500,
          serverError.message
        )
      }

    } catch (error: any) {
      // Clean up sandbox on any error
      if (sbx) {
        try {
          await sbx.kill()
          console.log('Sandbox cleaned up due to error:', sbx.sandboxId)
        } catch (cleanupError) {
          console.warn('Failed to cleanup sandbox:', cleanupError)
        }
      }

      if (error instanceof ApiException) {
        throw error
      }

      console.error('Sandbox API Error:', {
        message: error?.message,
        userID,
        teamID,
        template: fragment?.template,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      })

      throw new ApiException(
        'An unexpected error occurred while setting up the sandbox.',
        'unknown_error' as any,
        500,
        error?.message || 'Unknown error'
      )
    }
  },
  {
    max: 5, // Lower rate limit for resource-intensive operations
    window: '1h',
    skipWithApiKey: false // Always rate limit sandbox creation
  },
  {
    security: { enableSecurityHeaders: true },
    validation: {
      environmentVars: ['E2B_API_KEY'],
      maxBodySize: 5 * 1024 * 1024 // 5MB for code files
    }
  }
)
