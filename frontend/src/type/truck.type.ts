export interface Truck {
  id: number;
  imat: string;
  maxLoad: number;
  maxVolume: number;
  commands?: Array<{
    id: number;
    reference: string;
    status: 'WAITING' | 'PENDING' | 'DELIVERED' | 'CANCELLED';
    commandDate: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
