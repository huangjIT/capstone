import { getJson, sendJson } from './api';
import { getCurrentUserId } from './session';
import { MarketplaceItem } from '../constants/mockData';

export function fetchMarketplaceItems(category?: string): Promise<MarketplaceItem[]> {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  return getJson<MarketplaceItem[]>(`/api/marketplace/items${query}`);
}

export interface MarketplaceItemInput {
  name: string;
  emoji?: string;
  price: number;
  originalPrice?: number;
  condition?: string;
  category: string;
  description?: string;
}

export function createMarketplaceItem(input: MarketplaceItemInput): Promise<MarketplaceItem> {
  return sendJson<MarketplaceItem>('POST', '/api/marketplace/items', {
    sellerId: getCurrentUserId(),
    ...input,
  });
}

export function markItemSold(id: string): Promise<void> {
  return sendJson<void>('PUT', `/api/marketplace/items/${id}/sold`);
}
