export interface Truck {
  id: number;
  imat: string;
  maxLoad: number;
  maxVolume: number;
  maintenanceEndAt?: string | null;
  commands?: Array<{
    id: number;
    reference: string;
    status: 'WAITING' | 'PENDING' | 'DELIVERED' | 'CANCELLED';
    commandDate: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
