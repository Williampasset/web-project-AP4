import { useQuery } from '@tanstack/react-query';
import { fetchClients } from '../service/api/clients.service';
import type { ClientWithCommands } from '@type/client.type';

export const useClients = () => {
  return useQuery<ClientWithCommands[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
    refetchInterval: 15000,
  });
};
