import { useEffect, useRef } from "react";

/**
 * Custom hook to periodically trigger a callback with configurable interval.
 *
 * @param {Function} callback - Function to execute on each tick
 * @param {number} intervalMs - Polling interval in milliseconds
 * @param {boolean} enabled - Whether auto-refresh is active
 */
export function useAutoRefresh(callback, intervalMs, enabled = true) {
  const savedCallback = useRef(callback);

  // Keep latest callback reference without resetting timer
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !intervalMs || intervalMs <= 0) {
      return;
    }

    const id = setInterval(() => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, [enabled, intervalMs]);
}
