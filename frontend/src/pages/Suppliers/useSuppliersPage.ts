import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchFreeTransitLocations } from '@service/api/suppliers.service';
import type { FreeTransitLocation } from '@type/supplier.type';
import { useSuppliers } from '../../hooks/suppliers.hooks';
import { supplierMatchesSearch } from '@utils/suppliers.utils';

export function useSuppliersPage() {
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search')?.trim() ?? '';

  const {
    data: suppliers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSuppliers();

  const { data: freeTransitLocations = [] } = useQuery<FreeTransitLocation[]>({
    queryKey: ['suppliers', 'free-transit'],
    queryFn: fetchFreeTransitLocations,
    refetchInterval: 10000,
  });

  const [search, setSearch] = useState(searchFromUrl);

  useEffect(() => {
    setSearch(searchFromUrl);
  }, [searchFromUrl]);

  const filteredSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplierMatchesSearch(supplier, search)),
    [suppliers, search],
  );

  return {
    isLoading,
    isError,
    error,
    refetch,
    search,
    setSearch,
    freeTransitLocations,
    filteredSuppliers,
  };
}
