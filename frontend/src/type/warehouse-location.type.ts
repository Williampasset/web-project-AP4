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

export interface PendingStockJob {
  id: number;
  type: 'MOVE' | 'MERGE';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  quantity: number;
  sourceArticleId: number;
  targetLocationId: number | null;
  targetArticleId: number | null;
  requestedAt: string;
  assignedUser: {
    id: number;
    firstName: string;
    lastName: string;
    matricule: string;
  };
}

export interface WarehouseLocation extends Location {
  articles: WarehouseLocationArticle[];
  pendingJobs?: PendingStockJob[];
}
