import { IsInt, Min } from 'class-validator';

export class MoveArticleDto {
  @IsInt()
  @Min(1)
  targetLocationId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(1)
  assignedUserId: number;
}
