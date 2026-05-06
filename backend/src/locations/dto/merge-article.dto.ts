import { IsInt, Min } from 'class-validator';

export class MergeArticleDto {
  @IsInt()
  @Min(1)
  targetArticleId: number;
}
