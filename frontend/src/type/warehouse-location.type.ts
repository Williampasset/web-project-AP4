import type { Location } from './location.type';

export interface WarehouseLocationArticle {
  id: number;
  reference: string;
  label: string;
  stock: number;
  supplier?: {
    id: number;
    name: string;
  } | null;
}

export interface WarehouseLocation extends Location {
  articles: WarehouseLocationArticle[];
}
