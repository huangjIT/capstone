import { getJson, sendJson } from './api';
import { getCurrentUserId } from './session';
import { Notification } from '../constants/mockData';

export function fetchNotifications(): Promise<Notification[]> {
  const userId = getCurrentUserId();
  if (userId == null) return Promise.resolve([]);
  return getJson<Notification[]>(`/api/notifications?userId=${userId}`);
}

export function fetchUnreadCount(): Promise<number> {
  const userId = getCurrentUserId();
  if (userId == null) return Promise.resolve(0);
  return getJson<{ count: number }>(`/api/notifications/unread-count?userId=${userId}`).then(
    (r) => r.count
  );
}

export function markNotificationRead(id: string): Promise<void> {
  return sendJson<void>('PUT', `/api/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<void> {
  return sendJson<void>('PUT', `/api/notifications/read-all?userId=${getCurrentUserId()}`);
}
