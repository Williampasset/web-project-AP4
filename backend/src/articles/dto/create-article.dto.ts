import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Length,
} from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  readonly reference!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  readonly label!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  readonly weight!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly price!: number;

  @IsInt()
  @Min(0)
  readonly stock!: number;

  @IsInt()
  readonly locationId!: number;

  @IsInt()
  readonly supplierId!: number;
}
