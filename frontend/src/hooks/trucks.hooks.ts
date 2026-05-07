import { useQuery } from '@tanstack/react-query';
import { fetchTrucks } from '../service/api/trucks.service';
import type { Truck } from '@type/truck.type';

/**
 * Fetches trucks from the API and provides them to components.
 * @returns An object containing the trucks data, loading state, and error state
 */
export const useTrucks = () => {
  return useQuery<Truck[]>({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
  });
};
