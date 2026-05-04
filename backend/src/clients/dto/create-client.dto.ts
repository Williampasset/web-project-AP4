import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    description: 'Client name',
    example: 'Acme Corporation',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  readonly name!: string;

  @ApiProperty({
    description: 'Client address',
    example: '123 Business Street, Paris, 75000',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  readonly address!: string;

  @ApiPropertyOptional({
    description: 'Client email address',
    example: 'contact@acme.com',
    maxLength: 100,
  })
  @IsEmail()
  @IsOptional()
  @Length(1, 100)
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'Client phone number',
    example: '+33123456789',
    pattern: '^[\\d\\s+\\-().]*$',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[\d\s+\-().]*$/, {
    message: 'phone must be a valid phone number',
  })
  @Length(1, 20)
  readonly phone?: string;
}
