import { getHeaders } from './api.helper';
import type { WarehouseLocation } from '@type/warehouse-location.type';

const BASE_URL = 'http://localhost:3000/locations';

export const fetchLocations = async (): Promise<WarehouseLocation[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch locations');

  return res.json();
};
