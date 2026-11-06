/**
 * Browser-side fetch wrapper for the app's API.
 * Resolves with the parsed JSON body, or throws an Error carrying the API's message.
 */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.err || data?.message || `Request failed (${response.status})`);
  }
  return data;
}
