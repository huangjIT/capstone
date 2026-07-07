import { getJson } from './api';
import { getCurrentUserId } from './session';
import { NearbyPet, WalkingPartner, BlindDatePet } from '../constants/mockData';

// Backend DTOs (NearbyPetResponse, WalkingPartnerResponse, BlindDatePetResponse)
// are shaped 1:1 like the app interfaces, so responses need no re-mapping.

export function fetchNearbyPets(lat: number, lon: number, radiusKm = 5): Promise<NearbyPet[]> {
  return getJson<NearbyPet[]>(`/api/pets/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`);
}

export function fetchWalkingPartners(opts?: {
  lat?: number;
  lon?: number;
  species?: string;
}): Promise<WalkingPartner[]> {
  return getJson<WalkingPartner[]>(`/api/pets/partners?${discoveryQuery(opts)}`);
}

export function fetchBlindDatePets(opts?: {
  lat?: number;
  lon?: number;
  species?: string;
}): Promise<BlindDatePet[]> {
  return getJson<BlindDatePet[]>(`/api/pets/blind-dates?${discoveryQuery(opts)}`);
}

function discoveryQuery(opts?: { lat?: number; lon?: number; species?: string }): string {
  const params = new URLSearchParams();
  const userId = getCurrentUserId();
  if (userId != null) params.append('userId', String(userId));
  if (opts?.lat != null) params.append('lat', String(opts.lat));
  if (opts?.lon != null) params.append('lon', String(opts.lon));
  if (opts?.species) params.append('species', opts.species);
  return params.toString();
}
