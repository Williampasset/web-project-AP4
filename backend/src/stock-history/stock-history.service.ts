import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StockHistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.stockHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}
