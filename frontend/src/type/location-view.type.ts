import type { WarehouseLocation } from '@type/warehouse-location.type';

export type LocationCellStatus = 'pending' | 'empty' | 'alert' | 'ok';

export interface DisplayLocation extends WarehouseLocation {
  totalStock: number;
  status: LocationCellStatus;
}

export type Building = WarehouseLocation['building'];
