export interface Client {
  id: number;
  name: string;
  address: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}
