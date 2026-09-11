import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to execute and manage the state of a system command endpoint.
 *
 * @param {Function} fetchFn - API function returning a Promise
 * @param {Object} options - Configuration options
 * @param {boolean} [options.autoFetch=true] - Whether to trigger fetch immediately on mount
 * @param {any} [options.initialData=null] - Initial data before first fetch
 * @returns {{
 *   data: any,
 *   error: { message: string, status?: number } | null,
 *   loading: boolean,
 *   lastUpdated: string | null,
 *   status: 'idle' | 'loading' | 'success' | 'error',
 *   refresh: () => Promise<any>
 * }}
 */
export function useCommand(fetchFn, options = {}) {
  const { autoFetch = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState(autoFetch ? 'loading' : 'idle');

  const fetchCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const currentFetchId = ++fetchCountRef.current;
    setLoading(true);
    setStatus('loading');
    setError(null);

    try {
      const result = await fetchFn();

      if (isMountedRef.current && currentFetchId === fetchCountRef.current) {
        setData(result);
        setError(null);
        setStatus('success');
        setLastUpdated(result?.timestamp || new Date().toISOString());
        setLoading(false);
        return result;
      }
    } catch (err) {
      if (isMountedRef.current && currentFetchId === fetchCountRef.current) {
        setError(err);
        setStatus('error');
        setLoading(false);
      }
      throw err;
    }
  }, [fetchFn]);

  useEffect(() => {
    if (autoFetch) {
      refresh().catch(() => {
        // Handled in catch block inside refresh()
      });
    }
  }, [refresh, autoFetch]);

  return {
    data,
    error,
    loading,
    lastUpdated,
    status,
    refresh,
  };
}
