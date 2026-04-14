import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '../enum/role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly matricule!: string;

  @IsString()
  readonly lastName!: string;

  @IsString()
  readonly firstName!: string;

  @IsString()
  @IsNotEmpty()
  readonly password!: string;

  @IsEnum(Role)
  @IsNotEmpty()
  readonly role: Role = Role.MAGASINIER;

  @IsInt()
  @IsOptional()
  readonly managerId!: number;
}
