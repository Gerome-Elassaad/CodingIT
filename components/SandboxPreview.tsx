import { useState } from 'react';
import { Loader2, ExternalLink, RefreshCw, Terminal } from 'lucide-react';

interface SandboxPreviewProps {
  type: 'vite' | 'nextjs' | 'console';
  output?: string;
  isLoading?: boolean;
  sandboxUrl?: string; // Real URL from Vercel Sandbox API
}

export default function SandboxPreview({ 
  type, 
  output,
  isLoading = false,
  sandboxUrl
}: SandboxPreviewProps) {
  const [showConsole, setShowConsole] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Use the real sandbox URL passed from the API
  const previewUrl = sandboxUrl || '';

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  if (type === 'console') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="font-mono text-sm whitespace-pre-wrap text-gray-300">
          {output || 'No output yet...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Controls */}
      <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {type === 'vite' ? '⚡ Vite' : '▲ Next.js'} Preview
          </span>
          {previewUrl ? (
            <code className="text-xs bg-gray-900 px-2 py-1 rounded text-blue-400">
              {previewUrl}
            </code>
          ) : (
            <span className="text-xs text-gray-500">Waiting for sandbox URL...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Toggle console"
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Preview */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
        {(isLoading || !previewUrl) && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {!previewUrl 
                  ? 'Setting up sandbox environment...' 
                  : type === 'vite' 
                    ? 'Starting Vite dev server...' 
                    : 'Starting Next.js dev server...'
                }
              </p>
            </div>
          </div>
        )}
        
        {previewUrl && (
          <iframe
            key={iframeKey}
            src={previewUrl}
            className="w-full h-[600px] bg-white"
            title={`${type} preview`}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        )}
      </div>

      {/* Console Output (Toggle) */}
      {showConsole && output && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-400">Console Output</span>
          </div>
          <div className="font-mono text-xs whitespace-pre-wrap text-gray-300 max-h-48 overflow-y-auto">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}