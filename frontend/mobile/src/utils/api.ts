import AsyncStorage from '@react-native-async-storage/async-storage';

//const BASE_URL = 'https://pawpal-279020382757.us-central1.run.app'; // Cloud Run backend
const BASE_URL = 'http://10.0.2.2:8080'; // Local backend for Android emulator

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Delete/no-content responses (204, or 200 with an empty body) have nothing to
// parse — JSON.parse('') throws, so treat an empty body as success with no payload.
function parseBody<T>(text: string): T {
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Request failed');
  return parseBody<T>(text);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: await authHeaders(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Request failed');
  return parseBody<T>(text);
}

export async function apiPut<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Request failed');
  return parseBody<T>(text);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Request failed');
  return parseBody<T>(text);
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem('auth_token', token);
}

// userId of the signed-in account — used by the telemetry ping (the backend's
// /api/telemetry/location payload carries userId explicitly).
export async function saveUserId(userId: number | string) {
  await AsyncStorage.setItem('auth_user_id', String(userId));
}

export async function getUserId(): Promise<number | null> {
  const raw = await AsyncStorage.getItem('auth_user_id');
  return raw ? Number(raw) : null;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

export async function clearToken() {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('auth_user_id');
}
