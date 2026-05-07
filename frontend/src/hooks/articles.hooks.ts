import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '../service/api/articles.service';
import type { Article } from '@type/article.type';

export const useArticles = (refetchInterval = 10000) => {
  return useQuery<Article[]>({
    queryKey: ['articles'],
    queryFn: fetchArticles,
    refetchInterval,
  });
};
