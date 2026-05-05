import type { Client } from './client.type';
import type { Truck } from './truck.type';
import type { User } from './user.type';
import type { Location } from './location.type';

export type CommandStatus = 'WAITING' | 'PENDING' | 'DELIVERED' | 'CANCELLED';

export interface CommandItemPreparation {
  id: number;

  isPicked: boolean;
  pickedAt: string | null;

  isValidated: boolean;
  validatedAt: string | null;
  validationMethod: 'MANUAL' | 'QR_CODE';

  isAtLoadingZone: boolean;
  atLoadingZoneAt: string | null;

  isLoaded: boolean;
  loadedAt: string | null;

  rfidChecksPassed: number;
  rfidChecksFailed: number;
  lastRfidCheck: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CommandLoadingStage {
  id: number;
  stage: 'PREPARATION' | 'LOADING_ZONE' | 'LOADING_TRUCK' | 'LOADED';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

  rfidChecksPassed: number;
  rfidChecksFailed: number;

  startedAt: string | null;
  completedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CommandItem {
  id: number;
  quantity: number;
  unitPrice: number;
  articleId: number;

  article?: {
    id: number;
    reference: string;
    label: string;
    weight: number;
    volume: number;
    price: number;
    stock: number;
    location: Location;
  };

  commandItemPreparation?: CommandItemPreparation;
}

export interface Command {
  id: number;
  reference: string;
  status: CommandStatus;

  commandDate: string;
  deliveryDate: string | null;

  clientId: number;
  truckId: number | null;
  userId: number;

  createdAt: string;
  updatedAt: string;

  client: Client;
  user: User;
  truck: Truck | null;

  items: CommandItem[];
}

export const COMMAND_STATUSES: CommandStatus[] = [
  'WAITING',
  'PENDING',
  'DELIVERED',
  'CANCELLED',
];

export const STATUS_TRANSITIONS: Record<CommandStatus, CommandStatus[]> = {
  WAITING: ['PENDING', 'CANCELLED'],
  PENDING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};
