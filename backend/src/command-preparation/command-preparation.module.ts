import { Module } from '@nestjs/common';
import { CommandPreparationService } from './command-preparation.service';
import CommandPreparationController from './command-preparation.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [CommandPreparationController],
  providers: [CommandPreparationService, PrismaService],
  exports: [CommandPreparationService],
})
export class CommandPreparationModule {}
