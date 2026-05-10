import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BuildingName, Prisma } from '@prisma/client';

/**
 * Manages MOVE stock jobs - moving items from one location to another
 */
export class LocationsMovementService {
  constructor(private prisma: PrismaService) {}

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
      throw new BadRequestException(
        'Source and target locations must be different',
      );
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
      throw new NotFoundException(
        `Target location #${targetLocationId} not found`,
      );
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

  async validateMoveJob(
    job: Awaited<ReturnType<PrismaService['stockJob']['findUnique']>>,
    validatedByUserId: number,
  ) {
    if (!job?.targetLocationId) {
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
          stockJobId: job.id,
          createdByUserId: validatedByUserId,
          note: `Validation déplacement job #${job.id}`,
        },
      });

      await tx.stockJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          validatedByUserId,
          validatedAt: new Date(),
        },
      });
    });

    return { action: 'validate-job', jobId: job.id, status: 'COMPLETED' };
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
