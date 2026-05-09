import { getHeaders } from './api.helper';
import type { WarehouseLocation } from '@type/warehouse-location.type';

const BASE_URL = '/api/locations';

const parseErrorMessage = async (res: Response, fallback: string) => {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') return body.message;
    if (Array.isArray(body?.message)) return body.message.join(', ');
    if (body?.error) return String(body.error);
  } catch {
    try {
      const text = await res.text();
      if (text) return text;
    } catch {
      // ignore
    }
  }
  return fallback;
};

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
  assignedUserId: number,
) => {
  const res = await fetch(`${BASE_URL}/articles/${articleId}/move`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ targetLocationId, quantity, assignedUserId }),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, 'Impossible de déplacer le contenu de la cellule'),
    );
  }

  return res.json();
};

export const mergeLocationArticle = async (
  articleId: number,
  targetArticleId: number,
  assignedUserId: number,
) => {
  const res = await fetch(`${BASE_URL}/articles/${articleId}/merge`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ targetArticleId, assignedUserId }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Impossible de fusionner les cellules'));
  }

  return res.json();
};

export const deleteZeroStockLocationArticle = async (articleId: number) => {
  const res = await fetch(`${BASE_URL}/articles/${articleId}/zero-stock`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, 'Impossible de supprimer le contenu de la cellule'),
    );
  }

  return res.json();
};

export const validateStockJob = async (
  jobId: number,
  validatedByUserId: number,
) => {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}/validate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ validatedByUserId }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Impossible de valider le job'));
  }

  return res.json();
};
