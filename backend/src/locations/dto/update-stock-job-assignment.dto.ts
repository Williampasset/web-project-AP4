import { IsInt, Min } from 'class-validator';

export class UpdateStockJobAssignmentDto {
  @IsInt()
  @Min(1)
  assignedUserId: number;
}
