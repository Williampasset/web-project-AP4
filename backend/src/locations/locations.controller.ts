import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { LocationsService } from './locations.service';
import { MoveArticleDto } from './dto/move-article.dto';
import { MergeArticleDto } from './dto/merge-article.dto';
import { ValidateStockJobDto } from './dto/validate-stock-job.dto';
import { UpdateStockJobAssignmentDto } from './dto/update-stock-job-assignment.dto';

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
    return this.locationsService.createMoveJob(
      articleId,
      moveArticleDto.targetLocationId,
      moveArticleDto.quantity,
      moveArticleDto.assignedUserId,
    );
  }

  @Post('articles/:articleId/merge')
  async mergeArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() mergeArticleDto: MergeArticleDto,
  ) {
    return this.locationsService.createMergeJob(
      articleId,
      mergeArticleDto.targetArticleId,
      mergeArticleDto.assignedUserId,
    );
  }

  @Post('jobs/:jobId/validate')
  async validateJob(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Body() validateStockJobDto: ValidateStockJobDto,
  ) {
    return this.locationsService.validateStockJob(
      jobId,
      validateStockJobDto.validatedByUserId,
    );
  }

  @Patch('jobs/:jobId')
  async updateJobAssignment(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Body() updateStockJobAssignmentDto: UpdateStockJobAssignmentDto,
  ) {
    return this.locationsService.updateStockJobAssignment(
      jobId,
      updateStockJobAssignmentDto.assignedUserId,
    );
  }

  @Delete('articles/:articleId/zero-stock')
  async deleteZeroStockArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
  ) {
    return this.locationsService.deleteZeroStockArticle(articleId);
  }
}
