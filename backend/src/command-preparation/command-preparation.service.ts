// backend/src/commands/services/command-preparation.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommandStatus } from '../commands/enums/command-status.enum';
import {
  MarkItemPickedDto,
  ValidateItemDto,
  MoveToLoadingZoneDto,
  SimulateRfidCheckDto,
  LoadItemToTruckDto,
  CompleteLoadingDto,
} from './dto/prepare-item.dto';

@Injectable()
export class CommandPreparationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Mark a command item as picked from its location
   */
  async markItemPicked(dto: MarkItemPickedDto) {
    return this.prisma.$transaction(async (tx) => {
      const preparation = await tx.commandItemPreparation.findUnique({
        where: { commandItemId: dto.commandItemId },
        include: {
          commandItem: {
            include: {
              command: true,
              article: {
                select: {
                  id: true,
                  stock: true,
                  locationId: true,
                  reference: true,
                  label: true,
                },
              },
            },
          },
        },
      });

      if (!preparation) {
        throw new NotFoundException(
          `Préparation non trouvée pour l'article ${dto.commandItemId}`,
        );
      }

      // Idempotent: if already picked, do not decrement stock again
      if (preparation.isPicked) {
        return tx.commandItemPreparation.findUnique({
          where: { commandItemId: dto.commandItemId },
          include: { commandItem: true },
        });
      }

      const item = preparation.commandItem;
      const quantityToPick = item.quantity;
      const article = item.article;

      if (quantityToPick > article.stock) {
        throw new BadRequestException(
          `Stock insuffisant pour l'article ${article.reference ?? article.id}: demandé ${quantityToPick}, disponible ${article.stock}`,
        );
      }

      await tx.article.update({
        where: { id: item.articleId },
        data: { stock: { decrement: quantityToPick } },
      });

      const updatedPreparation = await tx.commandItemPreparation.update({
        where: { id: preparation.id },
        data: {
          isPicked: true,
          pickedAt: new Date(),
        },
        include: { commandItem: true },
      });

      await tx.stockHistory.create({
        data: {
          eventType: 'COMMAND_SHIPMENT',
          quantity: quantityToPick,
          articleId: item.articleId,
          articleReference: article.reference,
          articleLabel: article.label,
          fromLocationId: article.locationId,
          commandId: item.commandId,
          createdByUserId: item.command.userId ?? undefined,
          note: `Prélèvement opérateur sur commande ${item.command.reference}`,
        },
      });

      const command = item.command;
      const commandItems = await tx.commandItem.findMany({
        where: { commandId: command.id },
        include: { commandItemPreparation: true },
      });

      const allPicked = commandItems.every(
        (commandItem) => commandItem.commandItemPreparation?.isPicked,
      );

      if (allPicked) {
        await tx.command.update({
          where: { id: command.id },
          data: { status: 'READY' as any },
        });
      } else if (command.status === CommandStatus.WAITING) {
        await tx.command.update({
          where: { id: command.id },
          data: { status: CommandStatus.PENDING },
        });
      }

      return updatedPreparation;
    });
  }

  /**
   * Validate a picked item (manual or QR code)
   */
  async validateItem(dto: ValidateItemDto) {
    const preparation = await this.prisma.commandItemPreparation.findUnique({
      where: { commandItemId: dto.commandItemId },
    });

    if (!preparation) {
      throw new NotFoundException(
        `Préparation non trouvée pour l'article ${dto.commandItemId}`,
      );
    }

    if (!preparation.isPicked) {
      throw new BadRequestException(
        "L'article doit être marqué comme prélevé avant validation",
      );
    }

    return this.prisma.commandItemPreparation.update({
      where: { id: preparation.id },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        validationMethod: dto.method,
      },
      include: { commandItem: true },
    });
  }

  /**
   * Move all prepared items to loading zone (after RFID check)
   */
  async moveToLoadingZone(dto: MoveToLoadingZoneDto) {
    // Verify all items are validated
    const allItems = await this.prisma.commandItem.findMany({
      where: { commandId: dto.commandId },
      include: { commandItemPreparation: true },
    });

    const allValidated = allItems.every(
      (item) => item.commandItemPreparation?.isValidated,
    );

    if (!allValidated) {
      throw new BadRequestException(
        'Tous les articles doivent être validés avant de passer en zone de chargement',
      );
    }

    // Update all items
    const updates = await Promise.all(
      allItems.map((item) =>
        this.prisma.commandItemPreparation.update({
          where: { commandItemId: item.id },
          data: {
            isAtLoadingZone: true,
            atLoadingZoneAt: new Date(),
          },
        }),
      ),
    );

    // Create loading zone stage
    await this.prisma.commandLoadingStage.upsert({
      where: {
        commandId_stage: {
          commandId: dto.commandId,
          stage: 'LOADING_ZONE',
        },
      },
      update: { status: 'IN_PROGRESS', startedAt: new Date() },
      create: {
        commandId: dto.commandId,
        stage: 'LOADING_ZONE',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    return updates;
  }

  /**
   * Simulate RFID check for loading zone
   * In production, this would be a physical RFID reader
   */
  async simulateRfidCheck(dto: SimulateRfidCheckDto) {
    const stage = await this.prisma.commandLoadingStage.findUnique({
      where: {
        commandId_stage: {
          commandId: dto.commandId,
          stage: 'LOADING_ZONE',
        },
      },
    });

    if (!stage) {
      throw new NotFoundException('Étape de zone de chargement non trouvée');
    }

    const failed = dto.checksFailed || 0;
    const status = failed === 0 ? 'COMPLETED' : 'FAILED';

    return this.prisma.commandLoadingStage.update({
      where: { id: stage.id },
      data: {
        rfidChecksPassed: dto.checksPassed,
        rfidChecksFailed: failed,
        status: status,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Start loading items onto truck
   */
  async startLoading(commandId: number) {
    const command = await this.prisma.command.findUnique({
      where: { id: commandId },
    });

    if (!command) {
      throw new NotFoundException(`Commande ${commandId} non trouvée`);
    }

    return this.prisma.commandLoadingStage.upsert({
      where: {
        commandId_stage: {
          commandId: commandId,
          stage: 'LOADING_TRUCK',
        },
      },
      update: { status: 'IN_PROGRESS', startedAt: new Date() },
      create: {
        commandId: commandId,
        stage: 'LOADING_TRUCK',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  /**
   * Mark an item as loaded onto truck
   */
  async loadItemToTruck(dto: LoadItemToTruckDto) {
    const preparation = await this.prisma.commandItemPreparation.findUnique({
      where: { commandItemId: dto.commandItemId },
      include: { commandItem: { include: { command: true } } },
    });

    if (!preparation) {
      throw new NotFoundException(
        `Préparation non trouvée pour l'article ${dto.commandItemId}`,
      );
    }

    if (!preparation.isAtLoadingZone) {
      throw new BadRequestException(
        "L'article doit être en zone de chargement",
      );
    }

    return this.prisma.commandItemPreparation.update({
      where: { id: preparation.id },
      data: {
        isLoaded: true,
        loadedAt: new Date(),
      },
      include: { commandItem: true },
    });
  }

  /**
   * Complete loading with final RFID check
   */
  async completeLoading(dto: CompleteLoadingDto) {
    const command = await this.prisma.command.findUnique({
      where: { id: dto.commandId },
    });

    if (!command) {
      throw new NotFoundException(`Commande ${dto.commandId} non trouvée`);
    }

    // Verify all items are loaded
    const allItems = await this.prisma.commandItem.findMany({
      where: { commandId: dto.commandId },
      include: { commandItemPreparation: true },
    });

    const allLoaded = allItems.every(
      (item) => item.commandItemPreparation?.isLoaded,
    );

    if (!allLoaded) {
      throw new BadRequestException('Tous les articles doivent être chargés');
    }

    // Update loading truck stage to completed
    const stage = await this.prisma.commandLoadingStage.update({
      where: {
        commandId_stage: {
          commandId: dto.commandId,
          stage: 'LOADING_TRUCK',
        },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update command status to DELIVERED
    await this.prisma.command.update({
      where: { id: dto.commandId },
      data: {
        status: 'DELIVERED',
        deliveryDate: new Date(),
      },
    });

    return stage;
  }

  /**
   * Get preparation status for a command
   */
  async getPreparationStatus(commandId: number) {
    const command = await this.prisma.command.findUnique({
      where: { id: commandId },
      include: {
        items: {
          include: {
            article: true,
            commandItemPreparation: true,
          },
        },
        loadingStages: true,
      },
    });

    if (!command) {
      throw new NotFoundException(`Commande ${commandId} non trouvée`);
    }

    const stats = {
      total: command.items.length,
      picked: command.items.filter((i) => i.commandItemPreparation?.isPicked)
        .length,
      validated: command.items.filter(
        (i) => i.commandItemPreparation?.isValidated,
      ).length,
      atLoadingZone: command.items.filter(
        (i) => i.commandItemPreparation?.isAtLoadingZone,
      ).length,
      loaded: command.items.filter((i) => i.commandItemPreparation?.isLoaded)
        .length,
    };

    return {
      command,
      stats,
      progress: {
        pickingProgress: (stats.picked / stats.total) * 100,
        validationProgress: (stats.validated / stats.total) * 100,
        loadingZoneProgress: (stats.atLoadingZone / stats.total) * 100,
        loadingProgress: (stats.loaded / stats.total) * 100,
      },
    };
  }

  /**
   * Initialize preparation tracking for a new command
   * Called when command is created
   */
  async initializePreparation(commandId: number) {
    const command = await this.prisma.command.findUnique({
      where: { id: commandId },
      include: { items: true },
    });

    if (!command) {
      throw new NotFoundException(`Commande ${commandId} non trouvée`);
    }

    // Create preparation records for each item
    const preparations = await Promise.all(
      command.items.map((item) =>
        this.prisma.commandItemPreparation.create({
          data: {
            commandItemId: item.id,
          },
        }),
      ),
    );

    // Create initial loading stages
    await this.prisma.commandLoadingStage.createMany({
      data: [
        {
          commandId: commandId,
          stage: 'PREPARATION',
          status: 'PENDING',
        },
        {
          commandId: commandId,
          stage: 'LOADING_ZONE',
          status: 'PENDING',
        },
        {
          commandId: commandId,
          stage: 'LOADING_TRUCK',
          status: 'PENDING',
        },
        {
          commandId: commandId,
          stage: 'LOADED',
          status: 'PENDING',
        },
      ],
    });

    return preparations;
  }
}
