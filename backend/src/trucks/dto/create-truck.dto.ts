import { IsString, IsNotEmpty, IsNumber, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTruckDto {
  @ApiProperty({
    description: 'Truck license plate (IMAT)',
    example: 'AA-123-BB',
    pattern: '^[A-Z]{2}-\\d{3}-[A-Z]{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}-\d{3}-[A-Z]{2}$/, {
    message: 'imat must be a valid format: AA-123-BB',
  })
  readonly imat!: string;

  @ApiProperty({
    description: 'Maximum load capacity in kg',
    example: 1500,
    minimum: 0,
    type: 'number',
  })
  @IsNumber()
  @Min(0)
  readonly maxLoad!: number;
}
