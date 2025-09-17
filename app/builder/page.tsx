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
      const scrapeResponse = await fetch("/api/scrape-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!scrapeResponse.ok) {
        throw new Error("Failed to scrape website");
      }

      const scrapedData = await scrapeResponse.json();
      setProgress("Generating code...");

      const generationResponse = await fetch("/api/generate-ai-code-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a ${style} website based on the following content: ${scrapedData.data.markdown}`,
          context: {
            conversationContext: {
              scrapedWebsites: [{ url, content: scrapedData.data.markdown, timestamp: new Date().toISOString() }],
            },
          },
        }),
      });

      if (!generationResponse.body) {
        throw new Error("No response body from code generation");
      }

      const reader = generationResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullCode = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.substring(6));
              if (json.type === "stream") {
                fullCode += json.text;
                setGeneratedCode(fullCode);
              } else if (json.type === "status") {
                setProgress(json.message);
              } else if (json.type === "complete") {
                const finalCode = json.generatedCode;
                setGeneratedCode(finalCode);
                const blob = new Blob([finalCode], { type: "text/html" });
                const blobUrl = URL.createObjectURL(blob);
                setPreviewUrl(blobUrl);
                setProgress("Website ready!");
                setIsLoading(false);
                toast.success("Website generated successfully!");
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating website:", error);
      toast.error("Failed to generate website. Please try again.");
      setProgress("Error occurred");
      setTimeout(() => router.push('/'), 2000);
    }
  };

  const downloadCode = async () => {
    try {
      const response = await fetch('/api/create-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: generatedCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to create zip file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'website.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Code downloaded!");
    } catch (error) {
      console.error("Error downloading code:", error);
      toast.error("Failed to download code. Please try again.");
    }
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
