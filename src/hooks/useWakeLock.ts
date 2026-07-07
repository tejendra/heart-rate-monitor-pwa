import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled) {
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
      return;
    }

    let cancelled = false;

    async function acquireWakeLock() {
      if (!('wakeLock' in navigator) || cancelled) {
        return;
      }

      try {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
        }

        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // Unsupported, denied, or unavailable while hidden.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && enabled) {
        void acquireWakeLock();
      }
    }

    void acquireWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [enabled]);
}
