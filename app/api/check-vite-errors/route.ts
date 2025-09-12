import { NextResponse } from 'next/server';

// Stub endpoint to prevent 404 errors
// This endpoint is being called but the source is unknown
// Returns empty errors array to satisfy any calling code
export async function GET() {
  return NextResponse.json({
    success: true,
    errors: [],
    message: 'No Vite errors detected'
  });
}