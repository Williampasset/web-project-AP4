import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * Create a new article
   * POST /articles
   */
  @Post()
  async create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  /**
   * Retrieve all articles
   * GET /articles
   */
  @Get()
  async findAll() {
    return this.articlesService.findAll();
  }

  /**
   * Retrieve an article by id
   * GET /articles/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.findOne(id);
  }

  /**
   * Retrieve an article by reference
   * GET /articles/reference/:reference
   */
  @Get('reference/:reference')
  async findByReference(@Param('reference') reference: string) {
    return this.articlesService.findByReference(reference);
  }

  /**
   * Update an existing article
   * PATCH /articles/:id
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto);
  }

  /**
   * Delete an article
   * DELETE /articles/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.remove(id);
  }
}
