import { useEffect, useState } from 'react';

import { useApi } from './useApi';

const SEARCH_DELAY_MS = 300;

/**
 * Loads a long list one page at a time. The server does the paging and searching,
 * so the browser never downloads the whole collection. Pass the result to
 * <DataTable server={...} />.
 *
 *   const list = usePagedApi('/api/user/payment', { status: 'pending' });
 *
 * Pass null as the path to skip loading. Undefined filters are left out of the request.
 */
export function usePagedApi(path, filters = {}) {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // Wait for a pause in typing instead of sending one request per key press.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const defined = Object.entries(filters).filter(([, value]) => value !== undefined);
  if (query) defined.push(['q', query]);
  const filterKey = new URLSearchParams(defined).toString();

  // A new search or filter starts from the first page. Adjusting state during render
  // (rather than in an effect) avoids a wasted request for the old page.
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
  }

  const url = path && `${path}?page=${page}&limit=${limit}${filterKey && `&${filterKey}`}`;
  const { data, loading, error, reload } = useApi(url);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  // Deleting the only row on the last page would otherwise leave an empty page.
  useEffect(() => {
    if (data && data.rows.length === 0 && data.total > 0 && page > 0) setPage(page - 1);
  }, [data, page]);

  return { rows, total, loading, error, reload, page, setPage, limit, setLimit, search, setSearch };
}
