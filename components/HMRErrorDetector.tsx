import { useEffect, useRef } from 'react';

interface HMRErrorDetectorProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onErrorDetected: (errors: Array<{ type: string; message: string; package?: string }>) => void;
}

export default function HMRErrorDetector({ iframeRef, onErrorDetected }: HMRErrorDetectorProps) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkForHMRErrors = () => {
      if (!iframeRef.current) return;

      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (!iframeDoc) return;

        // Check for Vite error overlay
        const errorOverlay = iframeDoc.querySelector('vite-error-overlay');
        if (errorOverlay) {
          // Try to extract error message
          const messageElement = errorOverlay.shadowRoot?.querySelector('.message-body');
          if (messageElement) {
            const errorText = messageElement.textContent || '';
            
            // Parse import errors
            const importMatch = errorText.match(/Failed to resolve import "([^"]+)"/);
            if (importMatch) {
              const packageName = importMatch[1];
              if (!packageName.startsWith('.')) {
                // Extract base package name
                let finalPackage = packageName;
                if (packageName.startsWith('@')) {
                  const parts = packageName.split('/');
                  finalPackage = parts.length >= 2 ? parts.slice(0, 2).join('/') : packageName;
                } else {
                  finalPackage = packageName.split('/')[0];
                }

                onErrorDetected([{
                  type: 'npm-missing',
                  message: `Failed to resolve import "${packageName}"`,
                  package: finalPackage
                }]);
              }
            }
          }
        }
      } catch {
        // Cross-origin errors are expected, ignore them
      }
    };

    // Check immediately and then every 2 seconds
    checkForHMRErrors();
    checkIntervalRef.current = setInterval(checkForHMRErrors, 2000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [iframeRef, onErrorDetected]);

  return null;
}