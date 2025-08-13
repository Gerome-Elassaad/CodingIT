import { Sandbox } from '@e2b/code-interpreter'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { 
      command, 
      sbxId, 
      workingDirectory = '/home/user',
      teamID,
      accessToken 
    } = await req.json()

    if (!command || !sbxId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const sandbox = await Sandbox.connect(sbxId, {
      ...(teamID && accessToken
        ? {
            headers: {
              'X-Supabase-Team': teamID,
              'X-Supabase-Token': accessToken,
            },
          }
        : {}),
    })

    const fullCommand = `cd "${workingDirectory}" && ${command}`
    
    const result = await sandbox.commands.run(fullCommand, {
      timeoutMs: 30000,
    })

    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      workingDirectory,
    })

  } catch (error: any) {
    console.error('Terminal command error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to execute command',
        stderr: error.message || 'Command execution failed'
      },
      { status: 500 }
    )
  }
}