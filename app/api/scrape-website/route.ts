import { NextRequest, NextResponse } from "next/server";
import FirecrawlApp from '@mendable/firecrawl-js';

export async function POST(request: NextRequest) {
  try {
    const { url, formats = ['markdown', 'html'], options = {} } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }
    
    // Initialize Firecrawl with API key from environment
    const apiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      // For demo purposes, return mock data if API key is not set
      return NextResponse.json({
        success: true,
        data: {
          title: "Example Website",
          content: `This is a mock response for ${url}. Configure FIRECRAWL_API_KEY to enable real scraping.`,
          description: "A sample website",
          markdown: `# Example Website\n\nThis is mock content for demonstration purposes.`,
          html: `<h1>Example Website</h1><p>This is mock content for demonstration purposes.</p>`,
          metadata: {
            title: "Example Website",
            description: "A sample website",
            sourceURL: url,
            statusCode: 200
          }
        }
      });
    }
    
    const app = new FirecrawlApp({ apiKey });
    
    // Scrape the website using the latest SDK patterns
    // Include screenshot if requested in formats
    const scrapeResult = await app.scrape(url, {
      formats: formats,
      onlyMainContent: options.onlyMainContent !== false, // Default to true for cleaner content
      waitFor: options.waitFor || 2000, // Wait for dynamic content
      timeout: options.timeout || 30000,
      ...options // Pass through any additional options
    });
    
    // Handle the response according to the latest SDK structure
    const result = scrapeResult as any;
    if (result.success === false) {
      throw new Error(result.error || "Failed to scrape website");
    }
    
    // The SDK may return data directly or nested
    const data = result.data || result;
    
    return NextResponse.json({
      success: true,
      data: {
        title: data?.metadata?.title || "Untitled",
        content: data?.markdown || data?.html || "",
        description: data?.metadata?.description || "",
        markdown: data?.markdown || "",
        html: data?.html || "",
        metadata: data?.metadata || {},
        screenshot: data?.screenshot || null,
        links: data?.links || [],
        // Include raw data for flexibility
        raw: data
      }
    });
    
  } catch (error) {
    console.error("Error scraping website:", error);
    
    // Return a more detailed error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to scrape website",
      // Provide mock data as fallback for development
      data: {
        title: "Example Website",
        content: "This is fallback content due to an error. Please check your configuration.",
        description: "Error occurred while scraping",
        markdown: `# Error\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        html: `<h1>Error</h1><p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>`,
        metadata: {
          title: "Error",
          description: "Failed to scrape website",
          statusCode: 500
        }
      }
    }, { status: 500 });
  }
}

// Optional: Add OPTIONS handler for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}