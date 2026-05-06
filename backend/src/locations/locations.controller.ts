import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { LocationsService } from './locations.service';
import { MoveArticleDto } from './dto/move-article.dto';
import { MergeArticleDto } from './dto/merge-article.dto';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll() {
    return this.locationsService.findAll();
  }

  @Post('articles/:articleId/move')
  async moveArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() moveArticleDto: MoveArticleDto,
  ) {
    return this.locationsService.moveArticle(
      articleId,
      moveArticleDto.targetLocationId,
      moveArticleDto.quantity,
    );
  }

  @Post('articles/:articleId/merge')
  async mergeArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() mergeArticleDto: MergeArticleDto,
  ) {
    return this.locationsService.mergeArticles(articleId, mergeArticleDto.targetArticleId);
  }

  @Delete('articles/:articleId/zero-stock')
  async deleteZeroStockArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.locationsService.deleteZeroStockArticle(articleId);
  }
}
