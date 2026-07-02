import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:8080'; // Android emulator → localhost; change for real device

export async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
