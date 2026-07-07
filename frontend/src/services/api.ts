// Android emulator → 10.0.2.2; iOS simulator → localhost; physical device → machine LAN IP
export const BASE_URL = 'http://10.0.2.2:8080';

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
  return res.json();
}

export async function sendJson<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} failed with ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
