export interface SupplierArticle {
  id: number;
  reference: string;
  label: string;
  weight: number;
  volume: number;
  price: number;
  stock: number;
  location: {
    id: number;
    building: string;
    aisle: number;
    shelf: number;
    cell: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  articles: SupplierArticle[];
  createdAt: string;
  updatedAt: string;
}
