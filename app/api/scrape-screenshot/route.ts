import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Initialize Firecrawl with API key from environment
    const apiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return NextResponse.json({ 
        error: 'Firecrawl API key not configured' 
      }, { status: 500 });
    }
    
    const app = new FirecrawlApp({ apiKey });

    console.log('[scrape-screenshot] Attempting to capture screenshot for:', url);
    console.log('[scrape-screenshot] Using Firecrawl API key:', apiKey ? 'Present' : 'Missing');

    // Use the new v4 scrape method (not scrapeUrl)
    const scrapeResult = await app.scrape(url, {
      formats: ['screenshot'], // Request screenshot format
      waitFor: 3000, // Wait for page to fully load
      timeout: 30000,
      onlyMainContent: false, // Get full page for screenshot
      actions: [
        {
          type: 'wait',
          milliseconds: 2000 // Additional wait for dynamic content
        }
      ]
    });

    console.log('[scrape-screenshot] Full scrape result:', JSON.stringify(scrapeResult, null, 2));
    console.log('[scrape-screenshot] Scrape result type:', typeof scrapeResult);
    console.log('[scrape-screenshot] Scrape result keys:', Object.keys(scrapeResult));
    
    // The Firecrawl v4 API might return data directly without a success flag
    // Check if we have data with screenshot
    if (scrapeResult && scrapeResult.screenshot) {
      // Direct screenshot response
      return NextResponse.json({
        success: true,
        screenshot: scrapeResult.screenshot,
        metadata: scrapeResult.metadata || {}
      });
    } else if ((scrapeResult as any)?.data?.screenshot) {
      // Nested data structure
      return NextResponse.json({
        success: true,
        screenshot: (scrapeResult as any).data.screenshot,
        metadata: (scrapeResult as any).data.metadata || {}
      });
    } else if ((scrapeResult as any)?.success === false) {
      // Explicit failure
      console.error('[scrape-screenshot] Firecrawl API error:', (scrapeResult as any).error);
      throw new Error((scrapeResult as any).error || 'Failed to capture screenshot');
    } else {
      // No screenshot in response
      console.error('[scrape-screenshot] No screenshot in response. Full response:', JSON.stringify(scrapeResult, null, 2));
      throw new Error('Screenshot not available in response - check console for full response structure');
    }

  } catch (error: any) {
    console.error('[scrape-screenshot] Screenshot capture error:', error);
    console.error('[scrape-screenshot] Error stack:', error.stack);
    
    // Provide fallback response for development - removed NODE_ENV check as it doesn't work in Next.js production builds
    
    return NextResponse.json({ 
      error: error.message || 'Failed to capture screenshot'
    }, { status: 500 });
  }
}