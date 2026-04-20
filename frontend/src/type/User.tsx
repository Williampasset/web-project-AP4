export interface User {
    id: number;
    matricule: string;
    lastName: string;
    firstName: string;
    managerId: number | null;
    password: string;
    role: 'MANAGER' | 'MAGASINIER';
}