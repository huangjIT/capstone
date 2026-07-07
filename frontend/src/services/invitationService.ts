import { getJson, sendJson } from './api';
import { getCurrentUserId } from './session';
import { Invitation } from '../constants/mockData';

export interface InvitationInput {
  route: string;
  /** ISO local date-time, e.g. "2026-07-05T09:00:00" */
  dateTime: string;
  totalSpots: number;
  emoji?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export function fetchMyInvitations(): Promise<Invitation[]> {
  const userId = getCurrentUserId();
  if (userId == null) return Promise.resolve([]);
  return getJson<Invitation[]>(`/api/invitations?userId=${userId}`);
}

export function fetchOpenInvitations(): Promise<Invitation[]> {
  const userId = getCurrentUserId();
  const exclude = userId == null ? '' : `?excludeUserId=${userId}`;
  return getJson<Invitation[]>(`/api/invitations/open${exclude}`);
}

export function createInvitation(input: InvitationInput): Promise<Invitation> {
  return sendJson<Invitation>('POST', '/api/invitations', {
    organizerId: getCurrentUserId(),
    ...input,
  });
}

export function updateInvitation(id: string, input: Partial<InvitationInput>): Promise<Invitation> {
  return sendJson<Invitation>('PUT', `/api/invitations/${id}`, input);
}

export function cancelInvitation(id: string): Promise<void> {
  return sendJson<void>('DELETE', `/api/invitations/${id}`);
}

export function joinWalk(id: string): Promise<Invitation> {
  return sendJson<Invitation>('POST', `/api/invitations/${id}/join?userId=${getCurrentUserId()}`);
}
