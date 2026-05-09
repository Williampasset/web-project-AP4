// api/commands.api.ts
import { getHeaders } from './api.helper';
const BASE_URL = '/api/commands';

/**
 * Fetch commands with optional filters for status and userId.
 * @param params - An object containing optional filters:
 * status (e.g., 'WAITING', 'PENDING', 'FINISH') and userId (number).
 * @returns A promise that resolves to the list of commands matching the filters.
 * @throws An error if the API request fails.
 */
export const fetchCommands = async (params?: {
  status?: string;
  userId?: number;
}) => {
  const query = new URLSearchParams();

  if (params?.status) query.append('status', params.status);
  if (params?.userId) query.append('userId', String(params.userId));

  const res = await fetch(`${BASE_URL}?${query.toString()}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch commands');

  return res.json();
};

/**
 * Fetch a single command by its ID.
 * @param id - The ID of the command to fetch.
 * @returns A promise that resolves to the command data.
 * @throws An error if the command is not found or if the API request fails.
 */
export const fetchCommandById = async (id: number) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Command not found');

  return res.json();
};

/**
 * Create a new command with the provided data.
 * @param data - An object containing the necessary fields to create a command
 * (e.g., weight, status, commandDate, etc.).
 * @returns A promise that resolves to the newly created command data.
 * @throws An error if the API request fails.
 */
export const createCommand = async (data: any) => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to create command');

  return res.json();
};

/**
 * Update an existing command with the provided data.
 * @param param0 - An object containing the command ID and the data to update:
 * id (number) - The ID of the command to update.
 * data (object) - An object containing the fields to update (e.g., status, deliveryDate, etc.).
 * @returns A promise that resolves to the updated command data.
 * @throws An error if the command is not found or if the API request fails.
 */
export const updateCommand = async ({
  id,
  data,
}: {
  id: number;
  data: any;
}) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to update command');

  return res.json();
};

/**
 * Update the status of an existing command.
 * @param param0 - An object containing the command ID and the new status:
 * id (number) - The ID of the command to update.
 * status (string) - The new status to set (e.g., 'WAITING', 'PENDING', 'FINISH').
 * @returns A promise that resolves to the updated command data.
 * @throws An error if the command is not found or if the API request fails.
 */
export const updateCommandStatus = async ({
  id,
  status,
}: {
  id: number;
  status: string;
}) => {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error('Failed to update status');

  return res.json();
};

/**
 * Delete a command by its ID.
 * @param id - The ID of the command to delete.
 * @returns A promise that resolves to the response from the API after deletion.
 * @throws An error if the command is not found or if the API request fails.
 */
export const deleteCommand = async (id: number) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error('Failed to delete command');

  return res.json();
};
