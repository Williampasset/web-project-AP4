import { getHeaders } from './api.helper';
import type { Client, ClientWithCommands } from '@type/client.type';

const BASE_URL = '/api/clients';

export const fetchClients = async (): Promise<ClientWithCommands[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch clients');

  return res.json();
};

export interface CreateClientInput {
  name: string;
  address: string;
  email?: string;
  phone?: string;
}

export interface UpdateClientInput {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export const createClient = async (
  data: CreateClientInput,
): Promise<Client> => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to create client');

  return res.json();
};

export const updateClient = async (
  id: number,
  data: UpdateClientInput,
): Promise<Client> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to update client');

  return res.json();
};

export const deleteClient = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error('Failed to delete client');
};
