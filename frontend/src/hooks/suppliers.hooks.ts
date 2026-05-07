import { useQuery } from '@tanstack/react-query';
import { fetchSuppliers } from '../service/api/suppliers.service';
import type { Supplier } from '@type/supplier.type';

/**
 * Fetches suppliers from the API and provides them to components.
 * @returns An object containing the suppliers data, loading state, and error state
 */
export const useSuppliers = () => {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });
};
