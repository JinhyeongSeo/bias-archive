'use client';

import { useEffect, useRef, useCallback } from 'react';

const PROCESS_INTERVAL = 60000; // 1 minute between processing attempts

/**
 * Hook to automatically process archive queue in background
 * Calls /api/archive/process periodically when queue has items
 */
export function useArchiveQueue() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;

    try {
      isProcessingRef.current = true;

      // Check queue status first
      const statusRes = await fetch('/api/archive/process');
      if (!statusRes.ok) return;

      const status = await statusRes.json();

      // Only process if there are queued items
      if (status.queued > 0) {
        console.log(`[Archive] Processing queue: ${status.queued} items`);

        const processRes = await fetch('/api/archive/process', {
          method: 'POST',
        });

        if (processRes.ok) {
          const result = await processRes.json();
          console.log(`[Archive] Processed ${result.processed} items, ${result.remaining} remaining`);
        }
      }
    } catch (error) {
      console.error('[Archive] Queue processing error:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Process immediately on mount
    processQueue();

    // Then process periodically (every 1 minute)
    intervalRef.current = setInterval(processQueue, PROCESS_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [processQueue]);
}
