import type { Role } from './user.type';

export type TokenPayload = {
  userId: string;
  matricule: string;
  role: Role;
};
