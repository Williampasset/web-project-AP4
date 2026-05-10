import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { PrismaService } from '../prisma.service';
import { LocationsMovementService } from './services/locations-movement.service';
import { LocationsMergeService } from './services/locations-merge.service';
import { LocationsPreparationService } from './services/locations-preparation.service';

@Module({
  controllers: [LocationsController],
  providers: [
    PrismaService,
    LocationsService,
    LocationsMovementService,
    LocationsMergeService,
    LocationsPreparationService,
  ],
})
export class LocationsModule {}
