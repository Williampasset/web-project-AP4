import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommandItemDto {
  @IsInt()
  @Min(1)
  readonly articleId!: number;

  @IsInt()
  @Min(1)
  readonly quantity!: number;

  @IsInt()
  @Min(0)
  readonly unitPrice!: number;
}

export class CreateCommandDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  readonly reference!: string;

  @IsInt()
  @Min(1)
  readonly clientId!: number;

  @IsInt()
  @Min(1)
  readonly userId!: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  readonly truckId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCommandItemDto)
  readonly items!: CreateCommandItemDto[];
}
