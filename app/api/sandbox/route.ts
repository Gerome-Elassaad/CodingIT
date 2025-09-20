import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'
import templates from '@/lib/templates.json'

const sandboxTimeout = 10 * 60 * 1000

declare global {
  var activeSandbox: any;
}

export const maxDuration = 60
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const {
      fragment,
      userID,
      teamID,
      accessToken,
    }: {
      fragment: FragmentSchema
      userID: string | undefined
      teamID: string | undefined
      accessToken: string | undefined
    } = await req.json()

    if (!fragment) {
      return new Response(
        JSON.stringify({
          error: 'Missing fragment data',
          type: 'validation_error'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const validTemplates = Object.keys(templates);
    if (!fragment.template || !validTemplates.includes(fragment.template)) {
      console.warn(`[sandbox] Invalid or missing template: "${fragment.template}". Using fallback.`);

      let fixedTemplate = fragment.template;
      if (fragment.template === 'nextjs-develepor') {
        fixedTemplate = 'nextjs-developer';
      } else if (fragment.template === 'nextjs-14-app-directory' || fragment.template === 'nextjs-14') {
        fixedTemplate = 'nextjs-developer';
      } else if (!fragment.template || !validTemplates.includes(fragment.template)) {
        fixedTemplate = 'nextjs-developer'; // Default fallback
        console.log(`[sandbox] Template "${fragment.template}" not found. Using default fallback: ${fixedTemplate}`);
      }

      fragment.template = fixedTemplate;
      console.log(`[sandbox] Template corrected to: ${fragment.template}`);
    }

    if (!process.env.E2B_API_KEY) {
      console.error('E2B_API_KEY environment variable not found')
      return new Response(
        JSON.stringify({ 
          error: 'Code execution service is not configured. Please check environment settings.',
          type: 'config_error'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let sbx
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
      global.activeSandbox = sbx;
    } catch (e2bError: any) {
      console.error('E2B Sandbox creation failed:', e2bError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create sandbox environment. Please try again later.',
          type: 'sandbox_creation_error',
          details: e2bError.message
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    try {
      if (fragment.has_additional_dependencies && fragment.install_dependencies_command) {
        await sbx.commands.run(fragment.install_dependencies_command)
      }

      if (fragment.code && Array.isArray(fragment.code)) {
        await Promise.all(fragment.code.map(async (file) => {
          await sbx.files.write(file.file_path, file.file_content)
        }))
      } else if (fragment.code !== null && fragment.code !== undefined) {
        await sbx.files.write(fragment.file_path, fragment.code)
      } else {
        return new Response(
          JSON.stringify({
            error: 'Missing code data',
            type: 'validation_error'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (fragment.template === 'code-interpreter-v1') {
        const { logs, error, results } = await sbx.runCode(fragment.code || '')

        return new Response(
          JSON.stringify({
            success: true,
            sbxId: sbx?.sandboxId,
            sandboxId: sbx?.sandboxId,
            template: fragment.template,
            stdout: logs.stdout,
            stderr: logs.stderr,
            runtimeError: error,
            cellResults: results,
          } as ExecutionResultInterpreter),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      // For web-based templates (Next.js, React, etc.)
      let serverUrl = null;
      try {
        if (fragment.start_command) {
          console.log('[sandbox] Starting development server with command:', fragment.start_command);
          await sbx.commands.run(fragment.start_command, {
            envs: {
              PORT: (fragment.port || 3000).toString(),
            },
          });

          // Wait a moment for the server to start
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        serverUrl = `https://${sbx?.getHost(fragment.port || 3000)}`;
        console.log('[sandbox] Server URL:', serverUrl);
      } catch (startError) {
        console.warn('[sandbox] Failed to start development server:', startError);
        // Continue anyway - we'll provide the URL and let the client handle it
        serverUrl = `https://${sbx?.getHost(fragment.port || 3000)}`;
      }

      return new Response(
        JSON.stringify({
          success: true,
          sbxId: sbx?.sandboxId,
          sandboxId: sbx?.sandboxId,
          template: fragment.template,
          url: serverUrl,
          structure: 'Sandbox structure will be populated after file operations',
        } as ExecutionResultWeb),
        { headers: { 'Content-Type': 'application/json' } }
      )
    } catch (executionError: any) {
      console.error('Sandbox execution error:', executionError)
      
      // Clean up sandbox on execution error
      try {
        await sbx?.kill()
      } catch {}

      return new Response(
        JSON.stringify({ 
          error: 'Code execution failed. There may be an error in your code or dependencies.',
          type: 'execution_error',
          details: executionError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: any) {
    console.error('Sandbox API Error:', error)
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred while setting up the sandbox.',
        type: 'unknown_error',
        details: error?.message || 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
