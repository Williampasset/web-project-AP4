import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LocationsMovementService } from './services/locations-movement.service';
import { LocationsMergeService } from './services/locations-merge.service';
import { LocationsPreparationService } from './services/locations-preparation.service';

@Injectable()
export class LocationsService {
  constructor(
    private prisma: PrismaService,
    private movementService: LocationsMovementService,
    private mergeService: LocationsMergeService,
    private preparationService: LocationsPreparationService,
  ) {}

  async findAll() {
    await this.preparationService.ensurePreparationZonesPerBuilding();

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
    return this.movementService.createMoveJob(
      articleId,
      targetLocationId,
      quantity,
      assignedUserId,
    );
  }

  async createMergeJob(
    sourceArticleId: number,
    targetArticleId: number,
    assignedUserId: number,
  ) {
    return this.mergeService.createMergeJob(
      sourceArticleId,
      targetArticleId,
      assignedUserId,
    );
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
      return this.movementService.validateMoveJob(job, validatedByUserId);
    }

    if (job.type === 'MERGE') {
      return this.mergeService.validateMergeJob(
        jobId,
        job.sourceArticleId,
        job.targetArticleId!,
        job.quantity,
        validatedByUserId,
      );
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
    return this.preparationService.deleteZeroStockArticle(articleId);
  }


  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return user;
  }
}

