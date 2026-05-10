import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BuildingName, Prisma } from '@prisma/client';

/**
 * Manages warehouse preparation zones and article cleanup
 */
@Injectable()
export class LocationsPreparationService {
  constructor(private prisma: PrismaService) {}

  private static readonly OPERATIONAL_BUILDINGS: BuildingName[] = [
    BuildingName.A,
    BuildingName.B,
    BuildingName.C,
  ];

  private static readonly PREP_MIN_SLOTS_PER_BUILDING = 4;

  private static readonly PREP_DEFAULT_AISLE = 99;

  private static readonly PREP_DEFAULT_SHELF = 1;

  async ensurePreparationZonesPerBuilding() {
    // Clean up empty PREP locations
    await this.prisma.location.deleteMany({
      where: {
        building: BuildingName.P,
        zone: 'PREP',
        articles: { none: {} },
        targetStockJobs: { none: {} },
      },
    });

    const existingPrepLocations = await this.prisma.location.findMany({
      where: {
        zone: 'PREP',
        building: {
          in: [...LocationsPreparationService.OPERATIONAL_BUILDINGS],
        },
      },
      select: {
        building: true,
        aisle: true,
        shelf: true,
        cell: true,
      },
    });

    const byBuilding = new Map<BuildingName, Set<string>>();

    for (const building of LocationsPreparationService.OPERATIONAL_BUILDINGS) {
      byBuilding.set(building, new Set());
    }

    for (const location of existingPrepLocations) {
      const key = `${location.aisle}-${location.shelf}-${location.cell}`;
      byBuilding.get(location.building)?.add(key);
    }

    const toCreate: Prisma.LocationCreateManyInput[] = [];

    for (const building of LocationsPreparationService.OPERATIONAL_BUILDINGS) {
      const usedSlots = byBuilding.get(building) ?? new Set<string>();
      let nextCell = 1;

      while (
        usedSlots.size < LocationsPreparationService.PREP_MIN_SLOTS_PER_BUILDING
      ) {
        const key = `${LocationsPreparationService.PREP_DEFAULT_AISLE}-${LocationsPreparationService.PREP_DEFAULT_SHELF}-${nextCell}`;

        if (!usedSlots.has(key)) {
          usedSlots.add(key);
          toCreate.push({
            building,
            aisle: LocationsPreparationService.PREP_DEFAULT_AISLE,
            shelf: LocationsPreparationService.PREP_DEFAULT_SHELF,
            cell: nextCell,
            zone: 'PREP',
          });
        }

        nextCell += 1;
      }
    }

    if (toCreate.length > 0) {
      await this.prisma.location.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }
  }

  async deleteZeroStockArticle(articleId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { location: true },
    });

    if (!article) {
      throw new NotFoundException(`Article #${articleId} not found`);
    }

    if (article.stock !== 0) {
      throw new BadRequestException(
        'Only cells with 0 unit can be cleared to free the location',
      );
    }

    try {
      await this.prisma.article.delete({ where: { id: articleId } });
    } catch (error) {
      if (error?.code === 'P2003') {
        throw new ConflictException(
          `Article #${articleId} is referenced by existing records and cannot be deleted`,
        );
      }
      throw error;
    }

    await this.prisma.stockHistory.create({
      data: {
        eventType: 'CELL_CLEARED',
        quantity: 0,
        articleId: article.id,
        articleReference: article.reference,
        articleLabel: article.label,
        fromLocationId: article.locationId,
        note: `Suppression affectation cellule vide article #${article.id}`,
      },
    });

    return {
      action: 'delete-zero-stock',
      articleId,
      freedLocationId: article.locationId,
    };
  }
}
