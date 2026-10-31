/**
 * Minimal typed fetch helpers for the dashboard's JSON API routes.
 * Centralizes the fetch + JSON parse so hooks/containers stay lean.
 */

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  if ("error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && "message" in err) {
      return String((err as { message: unknown }).message);
    }
  }
  if ("message" in data) {
    return String((data as { message: unknown }).message);
  }
  return fallback;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | { error?: unknown } | null;
  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
    const msg = extractErrorMessage(data, res.statusText);
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
