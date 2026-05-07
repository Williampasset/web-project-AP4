import { IsInt, Min } from 'class-validator';

export class ValidateStockJobDto {
  @IsInt()
  @Min(1)
  validatedByUserId: number;
}
