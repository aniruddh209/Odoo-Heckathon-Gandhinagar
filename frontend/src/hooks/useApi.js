import { useState, useEffect, useCallback } from 'react';

/**
 * Reusable React hook for API data fetching without external state libraries.
 * Replaces TanStack Query for simple server-state requirements.
 * 
 * @param {Function} apiFn - The API function to execute
 * @param {Array} deps - Dependency array that triggers re-fetching when changed
 * @param {boolean} immediate - Whether to execute immediately on mount (default: true)
 * @returns {Object} { data, loading, error, execute, refetch, setData }
 */
export function useApi(apiFn, deps = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const msg = err?.message || 'An unexpected error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
    setData,
  };
}

export default useApi;
