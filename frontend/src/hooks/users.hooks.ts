import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  createUser,
  deleteUser,
  type CreateUserInput,
} from '../service/api/users.service';
import type { User } from '@type/user.type';

/**
 * Fetches users from the API and provides them to components.
 * @returns An object containing the users data, loading state, and error state
 */
export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
    refetchInterval: 15000,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
