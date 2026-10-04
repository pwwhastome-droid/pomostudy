import { useState, useEffect, useCallback, useRef } from 'react';

// Extend window interface for Document Picture-in-Picture API
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
      window: Window | null;
    };
  }
}

interface UsePictureInPictureProps {
  containerId: string;
}

export function usePictureInPicture({ containerId }: UsePictureInPictureProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPipOpen, setIsPipOpen] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' && 'documentPictureInPicture' in window
    );
  }, []);

  const togglePip = useCallback(async () => {
    if (!window.documentPictureInPicture) return;

    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      setIsPipOpen(false);
      return;
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 340,
        height: 380,
      });

      pipWindowRef.current = pipWindow;
      setIsPipOpen(true);

      // Copy stylesheet links and inline styles to the PiP window
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media.toString();
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          } else if (styleSheet.cssRules) {
            const style = document.createElement('style');
            Array.from(styleSheet.cssRules).forEach((rule) => {
              style.appendChild(document.createTextNode(rule.cssText));
            });
            pipWindow.document.head.appendChild(style);
          }
        } catch {
          // Cross-origin stylesheet rules access guard
        }
      });

      // Match dark theme background
      pipWindow.document.body.className = 'bg-[#030712] text-slate-100 flex items-center justify-center m-0 p-3 select-none overflow-hidden';

      const targetEl = document.getElementById(containerId);
      if (targetEl) {
        // Move element into PiP window
        pipWindow.document.body.appendChild(targetEl);
      }

      pipWindow.addEventListener('pagehide', () => {
        setIsPipOpen(false);
        pipWindowRef.current = null;
        // Return element back to main DOM
        const originContainer = document.getElementById('pip-original-host');
        if (originContainer && targetEl) {
          originContainer.appendChild(targetEl);
        }
      });
    } catch {
      setIsPipOpen(false);
      pipWindowRef.current = null;
    }
  }, [containerId]);

  return {
    isSupported,
    isPipOpen,
    togglePip,
  };
}
