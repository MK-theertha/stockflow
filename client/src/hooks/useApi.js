import { useCallback, useEffect, useRef, useState } from 'react';

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
  // Only the newest request may update the state: when `path` changes quickly,
  // responses can arrive out of order and an old one must not overwrite a new one.
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestRequest.current;
    if (!path) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFetch(path);
      if (request === latestRequest.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (request === latestRequest.current) {
        setState({ data: null, loading: false, error: error.message });
      }
    }
  }, [path]);

  useEffect(() => {
    load();
    // Ignore a response that arrives after the component has gone.
    return () => {
      latestRequest.current += 1;
    };
  }, [load]);

  return { ...state, reload: load };
}
