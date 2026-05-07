import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  type CreateClientInput,
  type UpdateClientInput,
} from '../service/api/clients.service';
import type { Client, ClientWithCommands } from '@type/client.type';

export const useClients = () => {
  return useQuery<ClientWithCommands[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
    refetchInterval: 15000,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientInput) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientInput }) =>
      updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
