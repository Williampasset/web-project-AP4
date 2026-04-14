import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  readonly matricule!: string;

  @IsString()
  @IsNotEmpty()
  readonly password!: string;
}
