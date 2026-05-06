import { IsInt, Min } from 'class-validator';

export class RestockArticleDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
