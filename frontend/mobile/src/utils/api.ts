import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://pawpal-279020382757.us-central1.run.app'; // Cloud Run backend

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Request failed');
  return JSON.parse(text) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: await authHeaders(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Request failed');
  return JSON.parse(text) as T;
}

export async function apiPut<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Request failed');
  return JSON.parse(text) as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Request failed');
  return JSON.parse(text) as T;
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem('auth_token', token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

export async function clearToken() {
  await AsyncStorage.removeItem('auth_token');
}
