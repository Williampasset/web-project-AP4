import { useQuery } from '@tanstack/react-query';
import { fetchSuppliers } from '../service/api/suppliers.service';
import type { Supplier } from '@type/supplier.type';

export const useSuppliers = () => {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });
};
