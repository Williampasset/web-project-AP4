import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StockHistoryController } from './stock-history.controller';
import { StockHistoryService } from './stock-history.service';

@Module({
  controllers: [StockHistoryController],
  providers: [StockHistoryService, PrismaService],
})
export class StockHistoryModule {}
