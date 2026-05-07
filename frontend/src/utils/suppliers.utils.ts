import type { FreeTransitLocation, Supplier, SupplierArticle } from '@type/supplier.type';

export const formatLocation = (article: SupplierArticle) => {
  const { building, aisle, shelf, cell } = article.location;
  return `${building}-${aisle}-${shelf}-${cell}`;
};

export const getStockClass = (stock: number) => {
  if (stock === 0) return 'badge badge--danger';
  if (stock < 10) return 'badge badge--warning';
  return 'badge badge--success';
};

export const getStockLabel = (stock: number) => {
  if (stock === 0) return 'Rupture';
  if (stock < 10) return 'Faible';
  return 'Disponible';
};

export const formatTransitLocation = (
  location: FreeTransitLocation,
  index: number,
) =>
  `IN-${String(index + 1).padStart(2, '0')} (${location.building}-${location.aisle}-${location.shelf}-${location.cell})`;

export const supplierMatchesSearch = (supplier: Supplier, search: string) => {
  const normalized = search.toLowerCase();
  return (
    supplier.name.toLowerCase().includes(normalized) ||
    supplier.email?.toLowerCase().includes(normalized) ||
    supplier.address.toLowerCase().includes(normalized) ||
    supplier.articles.some(
      (a) =>
        a.label.toLowerCase().includes(normalized) ||
        a.reference.toLowerCase().includes(normalized),
    )
  );
};

export const articleMatchesSearch = (article: SupplierArticle, search: string) => {
  const normalized = search.toLowerCase();
  return (
    article.label.toLowerCase().includes(normalized) ||
    article.reference.toLowerCase().includes(normalized)
  );
};
