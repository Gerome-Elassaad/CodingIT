import { NextRequest, NextResponse } from 'next/server';
import { edgeConfigAdapter } from '@/lib/edge-config-adapter';
import { getAllFeatureFlags } from '@/flags';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const useEdgeConfig = url.searchParams.get('edge') === 'true';
    const featureKey = url.searchParams.get('feature');

    if (useEdgeConfig) {
      if (featureKey) {
        const value = await edgeConfigAdapter.getFeatureValue(featureKey);
        
        return NextResponse.json({
          success: true,
          source: 'edge-config',
          feature: featureKey,
          value,
          timestamp: new Date().toISOString(),
        });
      } else {
        const features = await edgeConfigAdapter.getAllFeatures();
        const featureData = await edgeConfigAdapter.getFeatureData();
        
        return NextResponse.json({
          success: true,
          source: 'edge-config',
          features,
          metadata: {
            featuresCount: Object.keys(features).length,
            dateUpdated: featureData?.dateUpdated,
            cached: true,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      const flags = await getAllFeatureFlags();
      
      return NextResponse.json({
        success: true,
        source: 'growthbook-standard',
        flags,
        metadata: {
          flagsCount: Object.keys(flags).length,
          cached: false,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in edge-flags API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { features, context } = body;

    if (!features || !Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Invalid request: features array required' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};
    
    for (const featureKey of features) {
      results[featureKey] = await edgeConfigAdapter.getFeatureValue(featureKey, false, context);
    }

    return NextResponse.json({
      success: true,
      source: 'edge-config',
      features: results,
      context,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in batch feature check:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}