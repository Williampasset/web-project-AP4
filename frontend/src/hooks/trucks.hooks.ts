import { useQuery } from '@tanstack/react-query';
import { fetchTrucks } from '../service/api/trucks.service';
import type { Truck } from '@type/truck.type';

export const useTrucks = () => {
  return useQuery<Truck[]>({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
  });
};
