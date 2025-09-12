"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BuilderPage() {
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("modern");
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [progress, setProgress] = useState<string>("Initializing...");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Get the URL and style from sessionStorage
    const url = sessionStorage.getItem('targetUrl');
    const style = sessionStorage.getItem('selectedStyle');
    
    if (!url) {
      router.push('/');
      return;
    }
    
    setTargetUrl(url);
    setSelectedStyle(style || "modern");
    
    // Start the website generation process
    generateWebsite(url, style || "modern");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const generateWebsite = async (url: string, style: string) => {
    try {
      setProgress("Analyzing website...");
      
      // For demo purposes, we'll generate a simple HTML template
      // In production, this would call the actual scraping and generation APIs
      const mockGeneratedCode = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${style} Website - Reimagined</title>
  <style>
    :root {
      --primary: ${style === 'modern' ? '#FA5D19' : style === 'playful' ? '#9061ff' : style === 'professional' ? '#2a6dfb' : '#eb3424'};
      --background: ${style === 'modern' ? '#ffffff' : style === 'playful' ? '#f9f9f9' : style === 'professional' ? '#f5f5f5' : '#fafafa'};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--background);
      color: #262626;
      line-height: 1.6;
    }
    
    header {
      background: white;
      border-bottom: 1px solid #ededed;
      padding: 2rem;
    }
    
    nav {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary);
    }
    
    main {
      max-width: 1200px;
      margin: 4rem auto;
      padding: 0 2rem;
    }
    
    .hero {
      text-align: center;
      margin-bottom: 4rem;
    }
    
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--primary), #262626);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      font-size: 1.25rem;
      color: #666;
    }
    
    .cta-button {
      display: inline-block;
      margin-top: 2rem;
      padding: 1rem 2rem;
      background: var(--primary);
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      transition: transform 0.2s;
    }
    
    .cta-button:hover {
      transform: scale(1.05);
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 4rem;
    }
    
    .feature {
      padding: 2rem;
      background: white;
      border-radius: 1rem;
      border: 1px solid #ededed;
      transition: box-shadow 0.2s;
    }
    
    .feature:hover {
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    
    .feature h3 {
      margin-bottom: 1rem;
      color: var(--primary);
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <div class="logo">Reimagined</div>
      <div>
        <a href="#features" style="margin-right: 2rem; color: #666; text-decoration: none;">Features</a>
        <a href="#about" style="margin-right: 2rem; color: #666; text-decoration: none;">About</a>
        <a href="#contact" style="color: #666; text-decoration: none;">Contact</a>
      </div>
    </nav>
  </header>
  
  <main>
    <div class="hero">
      <h1>Welcome to Your ${style === 'modern' ? 'Modern' : style === 'playful' ? 'Playful' : style === 'professional' ? 'Professional' : 'Artistic'} Website</h1>
      <p class="subtitle">Reimagined from ${url}</p>
      <a href="#" class="cta-button">Get Started</a>
    </div>
    
    <div class="features" id="features">
      <div class="feature">
        <h3>Fast</h3>
        <p>Lightning-fast performance optimized for modern web standards.</p>
      </div>
      <div class="feature">
        <h3>Responsive</h3>
        <p>Looks great on all devices, from mobile to desktop.</p>
      </div>
      <div class="feature">
        <h3>Beautiful</h3>
        <p>Stunning design that captures attention and drives engagement.</p>
      </div>
    </div>
  </main>
</body>
</html>`;
      
      setGeneratedCode(mockGeneratedCode);
      
      // Create a blob URL for the preview
      const blob = new Blob([mockGeneratedCode], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
      
      setProgress("Website ready!");
      setIsLoading(false);
      
      // Show success message
      toast.success("Website generated successfully!");
      
    } catch (error) {
      console.error("Error generating website:", error);
      toast.error("Failed to generate website. Please try again.");
      setProgress("Error occurred");
      setTimeout(() => router.push('/'), 2000);
    }
  };
  
  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  return (
    <div className="min-h-screen bg-background-base">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-border-faint p-24 flex flex-col">
          <h2 className="text-title-small font-semibold mb-16">Building Your Website</h2>
          
          <div className="space-y-12 flex-1">
            <div>
              <div className="text-label-small text-black-alpha-56 mb-4">Target URL</div>
              <div className="text-body-medium text-accent-black truncate">{targetUrl}</div>
            </div>
            
            <div>
              <div className="text-label-small text-black-alpha-56 mb-4">Style</div>
              <div className="text-body-medium text-accent-black capitalize">{selectedStyle}</div>
            </div>
            
            <div>
              <div className="text-label-small text-black-alpha-56 mb-4">Status</div>
              <div className="text-body-medium text-heat-100">{progress}</div>
            </div>
          </div>
          
          <div className="space-y-8">
            {!isLoading && (
              <button
                onClick={downloadCode}
                className="w-full py-12 px-16 bg-heat-100 hover:bg-heat-200 text-white rounded-10 text-label-medium transition-all"
              >
                Download Code
              </button>
            )}
            
            <button
              onClick={() => router.push('/')}
              className="w-full py-12 px-16 bg-black-alpha-4 hover:bg-black-alpha-6 rounded-10 text-label-medium transition-all"
            >
              Start Over
            </button>
          </div>
        </div>
        
        {/* Preview */}
        <div className="flex-1 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-48 h-48 border-4 border-heat-100 border-t-transparent rounded-full animate-spin mb-16 mx-auto"></div>
                <p className="text-body-large text-black-alpha-56">{progress}</p>
              </div>
            </div>
          ) : (
            previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Website Preview"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}