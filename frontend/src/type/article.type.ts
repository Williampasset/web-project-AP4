import type { Location } from './location.type';
import type { Supplier } from './supplier.type';

export interface Article {
  id: number;
  reference: string;
  label: string;
  weight: number;
  volume: number;
  price: number;
  stock: number;
  locationId: number;
  supplierId: number | null;
  createdAt: string;
  updatedAt: string;
  location?: Location;
  supplier?: Supplier | null;
}
