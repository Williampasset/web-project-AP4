import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.location.findMany({
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
  }

  async moveArticle(articleId: number, targetLocationId: number, quantity: number) {
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

    try {
      if (quantity === article.stock) {
        const moved = await this.prisma.article.update({
          where: { id: articleId },
          data: { locationId: targetLocationId },
          include: {
            location: true,
            supplier: true,
          },
        });

        return {
          action: 'move',
          mode: 'full',
          articleId,
          movedQuantity: quantity,
          fromLocationId: article.locationId,
          toLocationId: targetLocationId,
          article: moved,
        };
      }

      const splitReference = `${article.reference}-MV-${targetLocationId}-${Date.now()}`;

      const result = await this.prisma.$transaction(async (tx) => {
        const sourceUpdated = await tx.article.update({
          where: { id: articleId },
          data: {
            stock: {
              decrement: quantity,
            },
          },
          include: {
            location: true,
            supplier: true,
          },
        });

        const movedPart = await tx.article.create({
          data: {
            reference: splitReference,
            label: article.label,
            weight: article.weight,
            volume: article.volume,
            price: article.price,
            stock: quantity,
            locationId: targetLocationId,
            supplierId: article.supplierId,
          },
          include: {
            location: true,
            supplier: true,
          },
        });

        return { sourceUpdated, movedPart };
      });

      return {
        action: 'move',
        mode: 'partial',
        sourceArticleId: articleId,
        movedArticleId: result.movedPart.id,
        movedQuantity: quantity,
        fromLocationId: article.locationId,
        toLocationId: targetLocationId,
        sourceArticle: result.sourceUpdated,
        movedArticle: result.movedPart,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `Target location #${targetLocationId} is already occupied`,
        );
      }
      throw error;
    }
  }

  async mergeArticles(sourceArticleId: number, targetArticleId: number) {
    if (sourceArticleId === targetArticleId) {
      throw new BadRequestException('Source and target articles must be different');
    }

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

    const merged = await this.prisma.$transaction(async (tx) => {
      const updatedTarget = await tx.article.update({
        where: { id: targetArticleId },
        data: {
          stock: {
            increment: source.stock,
          },
        },
        include: {
          location: true,
          supplier: true,
        },
      });

      await tx.article.delete({ where: { id: sourceArticleId } });

      return updatedTarget;
    });

    return {
      action: 'merge',
      sourceArticleId,
      targetArticleId,
      movedQuantity: source.stock,
      updatedStock: merged.stock,
      article: merged,
      freedLocationId: source.locationId,
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(
          `Article #${articleId} is referenced by existing records and cannot be deleted`,
        );
      }
      throw error;
    }

    return {
      action: 'delete-zero-stock',
      articleId,
      freedLocationId: article.locationId,
    };
  }
}
