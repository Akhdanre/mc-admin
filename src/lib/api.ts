/**
 * Minimal typed fetch helpers for the dashboard's JSON API routes.
 * Centralizes the fetch + JSON parse so hooks/containers stay lean.
 */

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
    const msg =
      data && typeof data === "object" && "error" in data ? String(data.error) : res.statusText;
    throw new Error(msg || `Request failed with status ${res.status}`);
  }
  return data as T;
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
