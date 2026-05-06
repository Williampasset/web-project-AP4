import { getHeaders } from './api.helper';
import type { Truck } from '@type/truck.type';

const BASE_URL = 'http://localhost:3000/trucks';

export const fetchTrucks = async (): Promise<Truck[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch trucks');

  return res.json();
};
