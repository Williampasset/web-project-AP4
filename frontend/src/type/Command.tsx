export type CommandStatus = 'WAITING' | 'PENDING' | 'DELIVERED' | 'CANCELLED';

export interface Command {
  id: number;
  reference: string;
  status: CommandStatus;
  commandDate: string;
  deliveryDate: string | null;
  clientId: number;
  truckId: number | null;
  userId: number;

  items: {
    id: number;
    quantity: number;
    unitPrice: number;
    articleId: number;
  }[];
}

export const COMMAND_STATUSES: CommandStatus[] = [
  'WAITING',
  'PENDING',
  'DELIVERED',
  'CANCELLED',
];
