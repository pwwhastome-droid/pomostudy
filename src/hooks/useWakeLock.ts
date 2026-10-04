import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean, isRunning: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let released = false;

    async function requestWakeLock() {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && enabled && isRunning) {
        try {
          sentinelRef.current = await navigator.wakeLock.request('screen');
          sentinelRef.current.addEventListener('release', () => {
            sentinelRef.current = null;
          });
        } catch {
          // Can fail if battery saver is on or document hidden
        }
      }
    }

    async function releaseWakeLock() {
      if (sentinelRef.current) {
        try {
          await sentinelRef.current.release();
        } catch {
          // Ignore
        }
        sentinelRef.current = null;
      }
    }

    if (enabled && isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && isRunning) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (!released) releaseWakeLock();
    };
  }, [enabled, isRunning]);
}
