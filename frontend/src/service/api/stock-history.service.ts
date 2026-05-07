import { getHeaders } from './api.helper';
import type { StockHistoryEntry } from '@type/stock-history.type';

const BASE_URL = 'http://localhost:3000/stock-history';

export const fetchStockHistory = async (): Promise<StockHistoryEntry[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch stock history');
  }

  return res.json();
};
