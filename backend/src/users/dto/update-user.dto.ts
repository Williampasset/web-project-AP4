import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsInt()
  managerId?: number;
}
