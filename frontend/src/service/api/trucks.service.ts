import { getHeaders } from './api.helper';
import type { Truck } from '@type/truck.type';
import type { Trip } from '@type/trip.type';

const BASE_URL = 'http://localhost:3000/trucks';

export const fetchTrucks = async (): Promise<Truck[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch trucks');

  return res.json();
};

export const departTruck = async (truckId: number) => {
  const res = await fetch(`${BASE_URL}/${truckId}/depart`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error('Impossible de faire partir le camion');

  return res.json();
};

export const fetchTruckHistory = async (): Promise<Trip[]> => {
  const res = await fetch(`${BASE_URL}/history`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Impossible de charger l’historique des trajets');

  return res.json();
};
