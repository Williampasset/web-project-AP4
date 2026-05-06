import { getHeaders } from './api.helper';
import type { WarehouseLocation } from '@type/warehouse-location.type';

const BASE_URL = 'http://localhost:3000/locations';

export const fetchLocations = async (): Promise<WarehouseLocation[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch locations');

  return res.json();
};

export const moveLocationArticle = async (
  articleId: number,
  targetLocationId: number,
  quantity: number,
) => {
  const res = await fetch(`${BASE_URL}/articles/${articleId}/move`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ targetLocationId, quantity }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Impossible de déplacer le contenu de la cellule');
  }

  return res.json();
};

export const mergeLocationArticle = async (
  articleId: number,
  targetArticleId: number,
) => {
  const res = await fetch(`${BASE_URL}/articles/${articleId}/merge`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ targetArticleId }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Impossible de fusionner les cellules');
  }

  return res.json();
};

export const deleteZeroStockLocationArticle = async (articleId: number) => {
  const res = await fetch(`${BASE_URL}/articles/${articleId}/zero-stock`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Impossible de supprimer le contenu de la cellule');
  }

  return res.json();
};
