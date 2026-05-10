// backend/src/command-preparation/dto/prepare-item.dto.ts
import { IsInt, IsEnum } from 'class-validator';

export enum ItemValidationMethod {
  MANUAL = 'MANUAL',
  QR_CODE = 'QR_CODE',
}

export class MarkItemPickedDto {
  @IsInt()
  commandItemId!: number;
}

export class ValidateItemDto {
  @IsInt()
  commandItemId!: number;

  @IsEnum(ItemValidationMethod)
  method!: ItemValidationMethod;
}

export class MoveToLoadingZoneDto {
  @IsInt()
  commandId!: number;
}

export class SimulateRfidCheckDto {
  @IsInt()
  commandId!: number;

  @IsInt()
  checksPassed!: number;

  @IsInt()
  checksFailed?: number;
}

export class LoadItemToTruckDto {
  @IsInt()
  commandItemId!: number;
}

export class CompleteLoadingDto {
  @IsInt()
  commandId!: number;
}
