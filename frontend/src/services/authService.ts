import { BASE_URL } from './api';
import { setCurrentUser } from './session';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) throw new Error('Invalid email or password');
  if (!res.ok) throw new Error('Login failed. Please try again.');
  const user: AuthUser = await res.json();
  setCurrentUser(user);
  return user;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      password,
      role: 'PET_OWNER',
      active: true,
      matchPreferencesMask: 0,
    }),
  });
  if (res.status === 400) throw new Error('An account with this email already exists.');
  if (!res.ok) throw new Error('Registration failed. Please try again.');
  const user: AuthUser = await res.json();
  setCurrentUser(user);
  return user;
}