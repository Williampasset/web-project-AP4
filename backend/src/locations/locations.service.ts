import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BuildingName, Prisma } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  private static readonly OPERATIONAL_BUILDINGS: BuildingName[] = [
    BuildingName.A,
    BuildingName.B,
    BuildingName.C,
  ];

  private static readonly PREP_MIN_SLOTS_PER_BUILDING = 4;

  private static readonly PREP_DEFAULT_AISLE = 99;

  private static readonly PREP_DEFAULT_SHELF = 1;

  private async ensurePreparationZonesPerBuilding() {
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
          in: [...LocationsService.OPERATIONAL_BUILDINGS],
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

    for (const building of LocationsService.OPERATIONAL_BUILDINGS) {
      byBuilding.set(building, new Set());
    }

    for (const location of existingPrepLocations) {
      const key = `${location.aisle}-${location.shelf}-${location.cell}`;
      byBuilding.get(location.building)?.add(key);
    }

    const toCreate: Prisma.LocationCreateManyInput[] = [];

    for (const building of LocationsService.OPERATIONAL_BUILDINGS) {
      const usedSlots = byBuilding.get(building) ?? new Set<string>();
      let nextCell = 1;

      while (usedSlots.size < LocationsService.PREP_MIN_SLOTS_PER_BUILDING) {
        const key = `${LocationsService.PREP_DEFAULT_AISLE}-${LocationsService.PREP_DEFAULT_SHELF}-${nextCell}`;

        if (!usedSlots.has(key)) {
          usedSlots.add(key);
          toCreate.push({
            building,
            aisle: LocationsService.PREP_DEFAULT_AISLE,
            shelf: LocationsService.PREP_DEFAULT_SHELF,
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

  async findAll() {
    await this.ensurePreparationZonesPerBuilding();

    const locations = await this.prisma.location.findMany({
      include: {
        articles: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: [
        { building: 'asc' },
        { aisle: 'asc' },
        { shelf: 'asc' },
        { cell: 'asc' },
      ],
    });

    const pendingJobs = await this.prisma.stockJob.findMany({
      where: { status: 'PENDING' },
      include: {
        sourceArticle: {
          select: {
            id: true,
            locationId: true,
            reference: true,
            label: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
      },
      orderBy: { requestedAt: 'asc' },
    });

    const jobsByLocationId = new Map<number, typeof pendingJobs>();
    for (const job of pendingJobs) {
      const locId = job.sourceArticle.locationId;
      const list = jobsByLocationId.get(locId) ?? [];
      list.push(job);
      jobsByLocationId.set(locId, list);
    }

    return locations.map((location) => ({
      ...location,
      pendingJobs: (jobsByLocationId.get(location.id) ?? []).map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        quantity: job.quantity,
        assignedUser: job.assignedUser,
        sourceArticleId: job.sourceArticleId,
        targetLocationId: job.targetLocationId,
        targetArticleId: job.targetArticleId,
        requestedAt: job.requestedAt,
      })),
    }));
  }

  async createMoveJob(
    articleId: number,
    targetLocationId: number,
    quantity: number,
    assignedUserId: number,
  ) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { location: true },
    });

    if (!article) {
      throw new NotFoundException(`Article #${articleId} not found`);
    }

    if (article.locationId === targetLocationId) {
      throw new BadRequestException('Source and target locations must be different');
    }

    if (quantity > article.stock) {
      throw new BadRequestException(
        `Cannot move ${quantity} unit(s): source only has ${article.stock}`,
      );
    }

    await this.ensureUserExists(assignedUserId);
    await this.ensureNoPendingJobForSourceArticle(articleId);

    const targetLocation = await this.prisma.location.findUnique({
      where: { id: targetLocationId },
      include: { articles: true },
    });

    if (!targetLocation) {
      throw new NotFoundException(`Target location #${targetLocationId} not found`);
    }

    if (targetLocation.articles.length > 0) {
      throw new ConflictException(
        `Target location #${targetLocationId} is already occupied`,
      );
    }

    const job = await this.prisma.stockJob.create({
      data: {
        type: 'MOVE',
        sourceArticleId: articleId,
        targetLocationId,
        quantity,
        assignedUserId,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
      },
    });

    return {
      action: 'create-move-job',
      job,
    };
  }

  async createMergeJob(
    sourceArticleId: number,
    targetArticleId: number,
    assignedUserId: number,
  ) {
    if (sourceArticleId === targetArticleId) {
      throw new BadRequestException('Source and target articles must be different');
    }

    await this.ensureUserExists(assignedUserId);
    await this.ensureNoPendingJobForSourceArticle(sourceArticleId);

    const [source, target] = await Promise.all([
      this.prisma.article.findUnique({
        where: { id: sourceArticleId },
        include: { location: true },
      }),
      this.prisma.article.findUnique({
        where: { id: targetArticleId },
        include: { location: true },
      }),
    ]);

    if (!source) {
      throw new NotFoundException(`Source article #${sourceArticleId} not found`);
    }

    if (!target) {
      throw new NotFoundException(`Target article #${targetArticleId} not found`);
    }

    const sourceLabel = source.label.trim().toLowerCase();
    const targetLabel = target.label.trim().toLowerCase();
    if (sourceLabel !== targetLabel) {
      throw new BadRequestException('Only same-article cells can be merged');
    }

    const job = await this.prisma.stockJob.create({
      data: {
        type: 'MERGE',
        sourceArticleId,
        targetArticleId,
        quantity: source.stock,
        assignedUserId,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
      },
    });

    return {
      action: 'create-merge-job',
      job,
    };
  }

  async validateStockJob(jobId: number, validatedByUserId: number) {
    const job = await this.prisma.stockJob.findUnique({
      where: { id: jobId },
      include: {
        sourceArticle: true,
        targetLocation: {
          include: { articles: true },
        },
        targetArticle: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Stock job #${jobId} not found`);
    }

    if (job.status !== 'PENDING') {
      throw new BadRequestException(`Stock job #${jobId} is not pending`);
    }

    if (job.assignedUserId !== validatedByUserId) {
      throw new BadRequestException(
        `Only assigned user #${job.assignedUserId} can validate this job`,
      );
    }

    await this.ensureUserExists(validatedByUserId);

    if (job.type === 'MOVE') {
      if (!job.targetLocationId) {
        throw new BadRequestException('MOVE job has no target location');
      }

      const source = await this.prisma.article.findUnique({
        where: { id: job.sourceArticleId },
      });

      if (!source) {
        throw new NotFoundException(
          `Source article #${job.sourceArticleId} not found`,
        );
      }

      if (job.quantity > source.stock) {
        throw new BadRequestException(
          `Cannot validate: source has ${source.stock}, job needs ${job.quantity}`,
        );
      }

      const targetLocation = await this.prisma.location.findUnique({
        where: { id: job.targetLocationId },
        include: { articles: true },
      });

      if (!targetLocation) {
        throw new NotFoundException(
          `Target location #${job.targetLocationId} not found`,
        );
      }

      if (targetLocation.articles.length > 0) {
        throw new ConflictException(
          `Target location #${job.targetLocationId} is already occupied`,
        );
      }

      await this.prisma.$transaction(async (tx) => {
        if (job.quantity === source.stock) {
          await tx.article.update({
            where: { id: source.id },
            data: { locationId: job.targetLocationId! },
          });
        } else {
          await tx.article.update({
            where: { id: source.id },
            data: {
              stock: {
                decrement: job.quantity,
              },
            },
          });

          await tx.article.create({
            data: {
              reference: `${source.reference}-MV-${job.targetLocationId}-${Date.now()}`,
              label: source.label,
              weight: source.weight,
              volume: source.volume,
              price: source.price,
              stock: job.quantity,
              locationId: job.targetLocationId!,
              supplierId: source.supplierId,
            },
          });
        }

        await tx.stockHistory.create({
          data: {
            eventType: 'MOVE_VALIDATED',
            quantity: job.quantity,
            articleId: source.id,
            articleReference: source.reference,
            articleLabel: source.label,
            fromLocationId: source.locationId,
            toLocationId: job.targetLocationId,
            stockJobId: jobId,
            createdByUserId: validatedByUserId,
            note: `Validation déplacement job #${jobId}`,
          },
        });

        await tx.stockJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            validatedByUserId,
            validatedAt: new Date(),
          },
        });
      });

      return { action: 'validate-job', jobId, status: 'COMPLETED' };
    }

    if (job.type === 'MERGE') {
      if (!job.targetArticleId) {
        throw new BadRequestException('MERGE job has no target article');
      }

      const [source, target] = await Promise.all([
        this.prisma.article.findUnique({ where: { id: job.sourceArticleId } }),
        this.prisma.article.findUnique({ where: { id: job.targetArticleId } }),
      ]);

      if (!source) {
        throw new NotFoundException(`Source article #${job.sourceArticleId} not found`);
      }

      if (!target) {
        throw new NotFoundException(`Target article #${job.targetArticleId} not found`);
      }

      const sourceLabel = source.label.trim().toLowerCase();
      const targetLabel = target.label.trim().toLowerCase();
      if (sourceLabel !== targetLabel) {
        throw new BadRequestException('Only same-article cells can be merged');
      }

      const qty = Math.min(job.quantity, source.stock);
      const isFullMerge = qty === source.stock;

      await this.prisma.$transaction(async (tx) => {
        await tx.article.update({
          where: { id: target.id },
          data: {
            stock: {
              increment: qty,
            },
          },
        });

        await tx.stockHistory.create({
          data: {
            eventType: 'MERGE_VALIDATED',
            quantity: qty,
            articleId: source.id,
            articleReference: source.reference,
            articleLabel: source.label,
            fromLocationId: source.locationId,
            toLocationId: target.locationId,
            stockJobId: jobId,
            createdByUserId: validatedByUserId,
            note: `Validation fusion job #${jobId}`,
          },
        });

        if (isFullMerge) {
          // Supprimer tous les jobs qui référencent encore l'article source,
          // y compris le job courant, pour libérer la contrainte FK sourceArticleId.
          await tx.stockJob.deleteMany({
            where: {
              OR: [
                { sourceArticleId: source.id },
                { targetArticleId: source.id },
              ],
            },
          });

          // Supprimer complètement l'article source après fusion complète
          await tx.article.delete({
            where: { id: source.id },
          });
        } else {
          await tx.article.update({
            where: { id: source.id },
            data: {
              stock: {
                decrement: qty,
              },
            },
          });
          await tx.stockJob.update({
            where: { id: jobId },
            data: {
              status: 'COMPLETED',
              validatedByUserId,
              validatedAt: new Date(),
            },
          });
        }
      });

      return {
        action: 'validate-job',
        jobId,
        status: 'COMPLETED',
        sourceFreed: isFullMerge,
      };
    }

    throw new BadRequestException(`Unsupported stock job type: ${job.type}`);
  }

  async updateStockJobAssignment(jobId: number, assignedUserId: number) {
    await this.ensureUserExists(assignedUserId);

    const job = await this.prisma.stockJob.findUnique({
      where: { id: jobId },
      include: {
        sourceArticle: {
          select: {
            id: true,
            reference: true,
            label: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
        targetLocation: {
          select: {
            id: true,
            building: true,
            aisle: true,
            shelf: true,
            cell: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Stock job #${jobId} not found`);
    }

    if (job.status !== 'PENDING') {
      throw new ConflictException(
        `Stock job #${jobId} is not pending and cannot be reassigned`,
      );
    }

    const updated = await this.prisma.stockJob.update({
      where: { id: jobId },
      data: { assignedUserId },
      include: {
        sourceArticle: {
          select: {
            id: true,
            reference: true,
            label: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
        targetLocation: {
          select: {
            id: true,
            building: true,
            aisle: true,
            shelf: true,
            cell: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      type: updated.type,
      status: updated.status,
      quantity: updated.quantity,
      sourceArticle: updated.sourceArticle,
      targetLocation: updated.targetLocation,
      assignedUserId: updated.assignedUserId,
      assignedUser: updated.assignedUser,
      requestedAt: updated.requestedAt,
    };
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
      if ((error as any)?.code === 'P2003') {
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

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return user;
  }

  private async ensureNoPendingJobForSourceArticle(articleId: number) {
    const pending = await this.prisma.stockJob.findFirst({
      where: {
        sourceArticleId: articleId,
        status: 'PENDING',
      },
      select: { id: true },
    });

    if (pending) {
      throw new ConflictException(
        `Article #${articleId} already has a pending stock job (#${pending.id})`,
      );
    }
  }
}
