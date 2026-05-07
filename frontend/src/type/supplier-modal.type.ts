import type { SupplierArticle } from '@type/supplier.type';

export interface SupplierOrderModalState {
  article: SupplierArticle;
  quantity: number;
  transitLocationId: number | null;
  message: string;
}
