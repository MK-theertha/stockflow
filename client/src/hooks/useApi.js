import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api-client';

/**
 * Loads `path` from the API when the component mounts or `path` changes.
 *
 *   const { data, loading, error, reload } = useApi('/api/user/stock/low');
 *
 * Pass null as the path to skip loading (e.g. until an id is known).
 */
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });

  const load = useCallback(async () => {
    if (!path) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      setState({ data: await apiFetch(path), loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
