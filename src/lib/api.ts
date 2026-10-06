/**
 * Minimal typed fetch helpers for the dashboard's JSON API routes.
 * Centralizes the fetch + JSON parse so hooks/containers stay lean.
 */

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return parseJson<T>(res);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseJson<T>(res);
}
