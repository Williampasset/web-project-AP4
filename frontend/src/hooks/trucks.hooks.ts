import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  departTruck,
  fetchTrucks,
  fetchTruckHistory,
} from '../service/api/trucks.service';
import type { Truck } from '@type/truck.type';
import type { Trip } from '@type/trip.type';

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

export const useDepartTruck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (truckId: number) => departTruck(truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['commands'] });
      queryClient.invalidateQueries({ queryKey: ['preparation-status'] });
      queryClient.invalidateQueries({ queryKey: ['truck-history'] });
    },
  });
};

export const useTruckHistory = () => {
  return useQuery<Trip[]>({
    queryKey: ['truck-history'],
    queryFn: fetchTruckHistory,
  });
};
