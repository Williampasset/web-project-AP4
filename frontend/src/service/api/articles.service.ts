import { getHeaders } from './api.helper';
import type { Article } from '@type/article.type';

const BASE_URL = 'http://localhost:3000/articles';

export const fetchArticles = async (): Promise<Article[]> => {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch articles');

  return res.json();
};
