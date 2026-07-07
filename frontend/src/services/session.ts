import { AuthUser } from './authService';

// In-memory session: set on login/register, read by the data services to scope
// queries to the signed-in user. Cleared when the app restarts.
let currentUser: AuthUser | null = null;

export function setCurrentUser(user: AuthUser | null) {
  currentUser = user;
}

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export function getCurrentUserId(): number | null {
  return currentUser ? currentUser.id : null;
}
