import { getHeaders } from './api.helper';
import type { ClientWithCommands } from '@type/client.type';

const BASE_URL = 'http://localhost:3000/clients';

export const fetchClients = async (): Promise<ClientWithCommands[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch clients');

  return res.json();
};
