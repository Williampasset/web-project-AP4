import { IsString, IsNotEmpty, IsInt, IsEnum } from 'class-validator';
import { Role } from '../enum/role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'MAT-001' })
  @IsString()
  @IsNotEmpty()
  readonly matricule!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  readonly lastName!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  readonly firstName!: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  readonly password!: string;

  @ApiProperty({
    enum: Role,
    example: Role.MAGASINIER,
    default: Role.MAGASINIER,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  readonly role: Role = Role.MAGASINIER;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  readonly managerId?: number;
}
