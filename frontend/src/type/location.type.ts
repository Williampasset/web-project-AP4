export type BuildingName = 'A' | 'B' | 'C' | 'D'; // adapte selon ton enum Prisma

export interface Location {
  id: number;

  building: BuildingName;
  aisle: number;
  shelf: number;
  cell: number;

  createdAt: string;
  updatedAt: string;
}
