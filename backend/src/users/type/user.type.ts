import { Role } from '../enum/role.enum';

export type User = {
  id: number;
  matricule: string;
  password: string;
  lastName: string;
  firstName: string;
  role: Role;
  managerId: number | null;
  createdAt: Date;
  updatedAt: Date;
};
