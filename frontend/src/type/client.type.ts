export interface Client {
  id: number;
  name: string;
  address: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientCommandSummary {
  id: number;
  reference: string;
  status: 'WAITING' | 'PENDING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  commandDate: string;
}

export interface ClientWithCommands extends Client {
  commands: ClientCommandSummary[];
}
