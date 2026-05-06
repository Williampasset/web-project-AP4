import { getHeaders } from './api.helper';
import type { Supplier } from '@type/supplier.type';

const BASE_URL = 'http://localhost:3000/suppliers';

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch suppliers');

  return res.json();
};

export const fetchSupplierById = async (id: number): Promise<Supplier> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Supplier not found');

  return res.json();
};
