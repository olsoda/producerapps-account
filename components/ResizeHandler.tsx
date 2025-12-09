'use client';

import { useEffect, useRef, useState } from 'react';

interface ResizeHandlerProps {
  publicPath: string;
}

interface ResizeMessage {
  type: 'mixflip-player-resize';
  playerId: string;
  height: number;
  timestamp: number;
}

export default function ResizeHandler({ publicPath }: ResizeHandlerProps) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Simple debounce function
  const debounce = (func: Function, delay: number) => {
    return (...args: any[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => func(...args), delay);
    };
  };

  // Helper to get player element (either loading or main)
  const getPlayerElement = (): HTMLElement | null => {
    return document.getElementById('mixflip-player-root');
  };

  useEffect(() => {
    // Wait for the player element to exist and be rendered
    const waitForPlayerElement = (retries = 0): void => {
      const playerElement = getPlayerElement();

      if (!playerElement || playerElement.offsetHeight === 0) {
        if (retries < 20) {
          // Max 2 seconds of retrying
          setTimeout(() => waitForPlayerElement(retries + 1), 100);
        } else {
          console.warn(
            'Player element not found or has no height after retries'
          );
        }
        return;
      }

      setIsReady(true);
      setupResizeHandling(playerElement);
    };

    const setupResizeHandling = (playerElement: HTMLElement): void => {
      // Function to send height to parent
      const sendHeight = (height: number, retries = 0): void => {
        const message: ResizeMessage = {
          type: 'mixflip-player-resize',
          playerId: publicPath,
          height: height,
          timestamp: Date.now()
        };

        // Send to parent window
        window.parent.postMessage(message, '*');

        // For initial load, try a few more times to ensure parent is ready
        if (retries < 3) {
          setTimeout(() => sendHeight(height, retries + 1), 100);
        }
      };

      // Debounced version for ResizeObserver
      const debouncedSendHeight = debounce((height: number) => {
        sendHeight(height);
      }, 150); // 150ms debounce

      // Send initial height immediately (no debounce for first load)
      sendHeight(playerElement.offsetHeight);

      // Set up ResizeObserver for subsequent changes
      observerRef.current = new ResizeObserver(
        (entries: ResizeObserverEntry[]) => {
          for (const entry of entries) {
            const height = entry.contentRect.height;
            debouncedSendHeight(height); // Use debounced version
          }
        }
      );

      observerRef.current.observe(playerElement);
    };

    // Start waiting for the element
    waitForPlayerElement();

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [publicPath]);

  // Window resize fallback (also debounced)
  useEffect(() => {
    if (!isReady) return;

    const handleResize = (): void => {
      const playerElement = getPlayerElement();
      if (playerElement) {
        const message: ResizeMessage = {
          type: 'mixflip-player-resize',
          playerId: publicPath,
          height: playerElement.offsetHeight,
          timestamp: Date.now()
        };
        window.parent.postMessage(message, '*');
        console.log('resized (window)', playerElement.offsetHeight);
      }
    };

    // Debounce window resize events too
    const debouncedHandleResize = debounce(handleResize, 150);

    window.addEventListener('resize', debouncedHandleResize);
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [publicPath, isReady]);

  return null;
}
