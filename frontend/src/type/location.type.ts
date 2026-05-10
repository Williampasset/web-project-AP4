export type BuildingName = 'A' | 'B' | 'C' | 'D' | 'P';
export type LocationZone = 'BULK' | 'PICK' | 'PREP' | 'TRANSIT';

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
