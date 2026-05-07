import type { WarehouseLocation } from '@type/warehouse-location.type';
import type { DisplayLocation } from './types';

export const sortByCoordinate = (a: WarehouseLocation, b: WarehouseLocation) =>
  a.aisle - b.aisle || a.shelf - b.shelf || a.cell - b.cell;

export const sortByFullCoordinate = (
  a: WarehouseLocation,
  b: WarehouseLocation,
) =>
  a.building.localeCompare(b.building) ||
  a.aisle - b.aisle ||
  a.shelf - b.shelf ||
  a.cell - b.cell;

export const toDisplayLocation = (location: WarehouseLocation): DisplayLocation => {
  const totalStock = location.articles.reduce((sum, article) => sum + article.stock, 0);
  const hasLowStock = location.articles.some((article) => article.stock < 10);
  const hasPending = (location.pendingJobs?.length ?? 0) > 0;
  const status = hasPending
    ? 'pending'
    : location.articles.length === 0
      ? 'empty'
      : hasLowStock
        ? 'alert'
        : 'ok';

  return {
    ...location,
    totalStock,
    status,
  };
};

export const formatLoc = (loc: WarehouseLocation) =>
  `${loc.building}-${loc.aisle}-${loc.shelf}-${loc.cell} [${loc.zone}]`;

export const getShortLabel = (label: string | null | undefined, max = 16) => {
  if (!label) return null;
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
};
