import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTruckDto {
  @ApiPropertyOptional({
    description: 'Truck license plate (IMAT)',
    example: 'BB-456-CC',
    pattern: '^[A-Z]{2}-\\d{3}-[A-Z]{2}$',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{2}-\d{3}-[A-Z]{2}$/, {
    message: 'imat must be a valid format: AA-123-BB',
  })
  readonly imat?: string;

  @ApiPropertyOptional({
    description: 'Maximum load capacity in kg',
    example: 2000,
    minimum: 0,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  readonly maxLoad?: number;

  @ApiPropertyOptional({
    description: 'Maximum volume capacity in m³',
    example: 35,
    minimum: 0,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  readonly maxVolume?: number;

  @ApiPropertyOptional({
    description: 'Maintenance end date/time (if truck is under maintenance)',
    example: '2026-05-10T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  readonly maintenanceEndAt?: string;
}
