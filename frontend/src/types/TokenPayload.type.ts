export type TokenPayload = {
  userId: string;
  matricule: string;
  role: Role;
};

export type Role = 'MAGASINIER' | 'MANAGER';
