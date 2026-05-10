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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { RestockArticleDto } from './dto/restock-article.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  /**
   * Create a new supplier
   * POST /suppliers
   */
  @Post()
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  /**
   * Retrieve all suppliers
   * GET /suppliers
   */
  @Get()
  async findAll() {
    return this.suppliersService.findAll();
  }

  /**
   * Retrieve free inbound transit locations
   * GET /suppliers/transit/free
   */
  @Get('transit/free')
  async findFreeTransitLocations() {
    return this.suppliersService.findFreeTransitLocations();
  }

  /**
   * Retrieve a supplier by id
   * GET /suppliers/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  /**
   * Search suppliers by name
   * GET /suppliers/search/:name
   */
  @Get('search/:name')
  async findByName(@Param('name') name: string) {
    return this.suppliersService.findByName(name);
  }

  /**
   * Get articles count for a supplier
   * GET /suppliers/:id/articles-count
   */
  @Get(':id/articles-count')
  async countArticles(@Param('id', ParseIntPipe) id: number) {
    const count = await this.suppliersService.countArticles(id);
    return { supplierId: id, articlesCount: count };
  }

  /**
   * Restock an article from a supplier
   * POST /suppliers/:id/articles/:articleId/restock
   */
  @Post(':id/articles/:articleId/restock')
  async restockArticle(
    @Param('id', ParseIntPipe) supplierId: number,
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() restockArticleDto: RestockArticleDto,
  ) {
    return this.suppliersService.restockArticle(
      supplierId,
      articleId,
      restockArticleDto.quantity,
      restockArticleDto.transitLocationId,
    );
  }

  /**
   * Update an existing supplier
   * PATCH /suppliers/:id
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  /**
   * Delete a supplier
   * DELETE /suppliers/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.remove(id);
  }
}
