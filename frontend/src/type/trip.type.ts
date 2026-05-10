import type { Command } from './command.type';
import type { Truck } from './truck.type';

export interface TripStop {
  id: number;
  stopOrder: number;
  status: 'PENDING' | 'ARRIVED' | 'DELIVERED' | 'FAILED' | 'SKIPPED';
  plannedArrivalAt: string | null;
  actualArrivalAt: string | null;
  deliveredAt: string | null;
  plannedWeight: number;
  plannedVolume: number;
  clientNameSnapshot: string;
  clientAddressSnapshot: string;
  commandRefSnapshot: string | null;
  deliveryNotes: string | null;
  command?: Command;
}

export interface Trip {
  id: number;
  reference: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  truckId: number;
  truck?: Truck;
  plannedDepartureAt: string | null;
  plannedArrivalAt: string | null;
  actualDepartureAt: string | null;
  actualArrivalAt: string | null;
  plannedWeight: number;
  plannedVolume: number;
  actualWeight: number | null;
  actualVolume: number | null;
  notes: string | null;
  deliveryStops: TripStop[];
  createdAt: string;
  updatedAt: string;
}