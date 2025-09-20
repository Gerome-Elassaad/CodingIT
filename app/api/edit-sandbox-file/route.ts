import { NextRequest, NextResponse } from 'next/server'

declare global {
  var activeSandbox: any
}

export async function POST(request: NextRequest) {
  try {
    const { filePath, content, operation = 'write' } = await request.json()

    if (!global.activeSandbox) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 404 })
    }

    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 })
    }

    console.log(`[edit-sandbox-file] ${operation} operation for file: ${filePath}`)

    let result

    switch (operation) {
      case 'write':
        // Write file content
        result = await global.activeSandbox.files.write(filePath, content || '')
        break

      case 'read':
        // Read file content
        result = await global.activeSandbox.files.read(filePath)
        return NextResponse.json({
          success: true,
          content: result,
          filePath
        })

      case 'create':
        // Create new file
        result = await global.activeSandbox.files.write(filePath, content || '')
        break

      case 'delete':
        // Delete file
        result = await global.activeSandbox.commands.run(`rm "${filePath}"`)
        if (result.exitCode !== 0) {
          throw new Error(`Failed to delete file: ${result.stderr}`)
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown operation: ${operation}`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      filePath,
      operation,
      message: `File ${operation} operation completed successfully`
    })

  } catch (error) {
    console.error('[edit-sandbox-file] Error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')

    if (!global.activeSandbox) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 404 })
    }

    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 })
    }

    console.log(`[edit-sandbox-file] Reading file: ${filePath}`)

    const content = await global.activeSandbox.files.read(filePath)

    return NextResponse.json({
      success: true,
      content,
      filePath
    })

  } catch (error) {
    console.error('[edit-sandbox-file] Read error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}