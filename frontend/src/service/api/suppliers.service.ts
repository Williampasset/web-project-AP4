import { getHeaders } from './api.helper';
import type { FreeTransitLocation, Supplier } from '@type/supplier.type';

const BASE_URL = '/api/suppliers';

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

export const fetchFreeTransitLocations = async (): Promise<FreeTransitLocation[]> => {
  const res = await fetch(`${BASE_URL}/transit/free`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch free inbound transit locations');

  return res.json();
};

export const restockSupplierArticle = async (
  supplierId: number,
  articleId: number,
  quantity: number,
  transitLocationId: number,
) => {
  const res = await fetch(
    `${BASE_URL}/${supplierId}/articles/${articleId}/restock`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ quantity, transitLocationId }),
    },
  );

  if (!res.ok) {
    let details = '';

    try {
      const errorBody = await res.json();
      if (typeof errorBody?.message === 'string') {
        details = errorBody.message;
      } else if (Array.isArray(errorBody?.message)) {
        details = errorBody.message.join(', ');
      } else if (errorBody?.error) {
        details = String(errorBody.error);
      }
    } catch {
      try {
        details = await res.text();
      } catch {
        details = '';
      }
    }

    throw new Error(
      `Erreur ${res.status} lors de l'enregistrement en stock${details ? `: ${details}` : ''}`,
    );
  }

  return res.json();
};
