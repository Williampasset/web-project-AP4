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
