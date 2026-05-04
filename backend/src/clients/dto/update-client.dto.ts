import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiPropertyOptional({
    description: 'Client name',
    example: 'Acme Corporation Updated',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  readonly name?: string;

  @ApiPropertyOptional({
    description: 'Client address',
    example: '456 New Avenue, Paris, 75001',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  readonly address?: string;

  @ApiPropertyOptional({
    description: 'Client email address',
    example: 'newemail@acme.com',
    maxLength: 100,
  })
  @IsEmail()
  @IsOptional()
  @Length(1, 100)
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'Client phone number',
    example: '+33987654321',
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
