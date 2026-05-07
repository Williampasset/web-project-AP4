import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '../service/api/articles.service';
import type { Article } from '@type/article.type';

/**
 * Fetches articles from the API and provides them to components.
 * The data is refetched every 10 seconds by default
 * @param refetchInterval - The interval in milliseconds to refetch the articles (default: 10000ms)
 * @returns An object containing the articles data, loading state, and error state
 */
export const useArticles = (refetchInterval = 10000) => {
  return useQuery<Article[]>({
    queryKey: ['articles'],
    queryFn: fetchArticles,
    refetchInterval,
  });
};
