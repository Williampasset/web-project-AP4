import { Module } from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { TrucksController } from './trucks.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TrucksController],
  providers: [TrucksService, PrismaService],
  exports: [TrucksService],
})
export class TrucksModule {}
