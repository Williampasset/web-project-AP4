import { getHeaders } from './api.helper';
import type { User } from '@type/user.type';

const BASE_URL = 'http://localhost:3000/users';

export const fetchUsers = async (): Promise<User[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch users');

  return res.json();
};

export interface CreateUserInput {
  matricule: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'MANAGER' | 'MAGASINIER';
  managerId?: number;
}

export const createUser = async (data: CreateUserInput): Promise<User> => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create user');
  }

  return res.json();
};

export const deleteUser = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error('Failed to delete user');
};
