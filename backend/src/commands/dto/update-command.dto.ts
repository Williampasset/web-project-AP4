import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDate,
  Min,
  Length,
} from 'class-validator';
import { CommandStatus } from '../enums/command-status.enum';

export class UpdateCommandDto {
  @IsString()
  @IsOptional()
  @Length(1, 50)
  readonly reference?: string;

  @IsEnum(CommandStatus)
  @IsOptional()
  readonly status?: CommandStatus;

  @IsDate()
  @IsOptional()
  readonly deliveryDate?: Date;

  @IsInt()
  @IsOptional()
  @Min(1)
  readonly clientId?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  readonly truckId?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  readonly userId?: number;
}
