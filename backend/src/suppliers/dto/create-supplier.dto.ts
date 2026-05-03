import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  readonly name!: string;

  @IsEmail()
  @IsOptional()
  @Length(1, 100)
  readonly email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[\d\s+\-().]*$/, {
    message: 'phone must be a valid phone number',
  })
  @Length(1, 20)
  readonly phone?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  readonly address!: string;
}
