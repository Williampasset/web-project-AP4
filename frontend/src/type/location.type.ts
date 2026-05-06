export type BuildingName = 'A' | 'B' | 'C' | 'D';
export type LocationZone = 'BULK' | 'PICK';

export interface Location {
  id: number;

  building: BuildingName;
  aisle: number;
  shelf: number;
  cell: number;
  zone: LocationZone;

  createdAt: string;
  updatedAt: string;
}
