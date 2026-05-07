import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { StockHistoryService } from './stock-history.service';

@Controller('stock-history')
@UseGuards(JwtAuthGuard)
export class StockHistoryController {
  constructor(private readonly stockHistoryService: StockHistoryService) {}

  @Get()
  async findAll() {
    return this.stockHistoryService.findAll();
  }
}
