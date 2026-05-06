import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../service/api/users.service';
import type { User } from '@type/user.type';

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
};
