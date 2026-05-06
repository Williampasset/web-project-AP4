export type StockHistoryEventType =
  | 'SUPPLIER_INBOUND'
  | 'COMMAND_SHIPMENT'
  | 'COMMAND_REVERT'
  | 'MOVE_VALIDATED'
  | 'MERGE_VALIDATED'
  | 'CELL_CLEARED';

export interface StockHistoryEntry {
  id: number;
  eventType: StockHistoryEventType;
  quantity: number;
  articleId: number | null;
  articleReference: string | null;
  articleLabel: string | null;
  fromLocationId: number | null;
  toLocationId: number | null;
  supplierId: number | null;
  commandId: number | null;
  stockJobId: number | null;
  note: string | null;
  createdByUserId: number | null;
  createdAt: string;
  // Champs enrichis du backend
  fromLocationName?: string | null;
  toLocationName?: string | null;
  supplierName?: string | null;
  commandRef?: string | null;
  jobId?: number | null;
}
