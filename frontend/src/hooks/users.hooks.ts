import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../service/api/users.service';
import type { User } from '@type/user.type';

/**
 * Fetches users from the API and provides them to components.
 * @returns An object containing the users data, loading state, and error state
 */
export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
};
