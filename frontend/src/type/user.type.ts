export type Role = 'MAGASINIER' | 'MANAGER';

export interface User {
  id: number;
  matricule: string;
  firstName: string;
  lastName: string;
  role: 'MANAGER' | 'MAGASINIER';
  managerId: number | null;
  createdAt: string;
  updatedAt: string;
}
