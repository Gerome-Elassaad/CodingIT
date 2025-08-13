import { NextResponse } from 'next/server'
import { evaluateCode } from '@/app/api/chat/codeInterpreter'

export async function POST(req: Request) {
  try {
    const { sessionID, code } = await req.json()

    if (!sessionID || !code) {
      return NextResponse.json(
        { error: 'sessionID and code are required' },
        { status: 400 },
      )
    }

    const result = await evaluateCode(sessionID, code)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
