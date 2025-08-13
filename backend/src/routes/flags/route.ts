import { NextRequest, NextResponse } from 'next/server';
import { getAllFeatureFlags } from '@/flags';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const flags = await getAllFeatureFlags();
    
    return NextResponse.json({
      success: true,
      flags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feature flags',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}