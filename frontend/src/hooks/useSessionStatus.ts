import { useEffect, useRef } from 'react';
import { getAuthStatus } from '../services/api';

interface UseSessionStatusOptions {
  enabled: boolean;
  onInvalid: () => void;
  pollInterval?: number;
}

export function useSessionStatus({
  enabled,
  onInvalid,
  pollInterval = 30000, // 30 seconds default
}: UseSessionStatusOptions): void {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await getAuthStatus();
        if (response.success && response.data && !response.data.valid) {
          console.log('Session invalidated:', response.data.reason);
          onInvalid();
        }
      } catch (error) {
        console.error('Session status check failed:', error);
      }
    };

    // Start polling
    intervalRef.current = window.setInterval(checkStatus, pollInterval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, onInvalid, pollInterval]);
}
