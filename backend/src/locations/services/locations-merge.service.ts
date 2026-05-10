import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/**
 * Manages MERGE stock jobs - merging items from one cell to another
 */
export class LocationsMergeService {
  constructor(private prisma: PrismaService) {}

  async createMergeJob(
    sourceArticleId: number,
    targetArticleId: number,
    assignedUserId: number,
  ) {
    if (sourceArticleId === targetArticleId) {
      throw new BadRequestException(
        'Source and target articles must be different',
      );
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
      throw new NotFoundException(
        `Source article #${sourceArticleId} not found`,
      );
    }

    if (!target) {
      throw new NotFoundException(
        `Target article #${targetArticleId} not found`,
      );
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

  async validateMergeJob(
    jobId: number,
    sourceArticleId: number,
    targetArticleId: number,
    quantity: number,
    validatedByUserId: number,
  ) {
    const [source, target] = await Promise.all([
      this.prisma.article.findUnique({ where: { id: sourceArticleId } }),
      this.prisma.article.findUnique({ where: { id: targetArticleId } }),
    ]);

    if (!source) {
      throw new NotFoundException(
        `Source article #${sourceArticleId} not found`,
      );
    }

    if (!target) {
      throw new NotFoundException(
        `Target article #${targetArticleId} not found`,
      );
    }

    const sourceLabel = source.label.trim().toLowerCase();
    const targetLabel = target.label.trim().toLowerCase();
    if (sourceLabel !== targetLabel) {
      throw new BadRequestException('Only same-article cells can be merged');
    }

    const qty = Math.min(quantity, source.stock);
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
        // Delete all jobs referencing the source article
        await tx.stockJob.deleteMany({
          where: {
            OR: [
              { sourceArticleId: source.id },
              { targetArticleId: source.id },
            ],
          },
        });

        // Delete the source article after full merge
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
