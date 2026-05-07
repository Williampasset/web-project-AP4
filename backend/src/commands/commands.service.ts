import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateCommandDto } from './dto/create-command.dto';
import { UpdateCommandDto } from './dto/update-command.dto';
import { PrismaService } from '../prisma.service';
import { CommandStatus } from './enums/command-status.enum';

@Injectable()
export class CommandsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new command with items
   * @param createCommandDto Validated data for command creation
   * @returns Created command with items
   */
  async create(createCommandDto: CreateCommandDto) {
    const { reference, clientId, userId, truckId, items } = createCommandDto;

    if (await this.doesReferenceExist(reference)) {
      throw new ConflictException(
        'The reference is already used by another command',
      );
    }

    await this.ensureClientExists(clientId);

    await this.ensureUserExists(userId);

    if (truckId) {
      await this.ensureTruckExists(truckId);
    }

    for (const item of items) {
      await this.ensureArticleExists(item.articleId);
      const article = await this.prisma.article.findUnique({
        where: { id: item.articleId },
      });
      if (article!.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for article #${item.articleId}. Available: ${article!.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    const result = await this.prisma.command.create({
      data: {
        reference,
        status: CommandStatus.WAITING,
        clientId,
        userId,
        truckId,
        items: {
          create: items.map((item) => ({
            articleId: item.articleId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        client: true,
        user: true,
        truck: true,
      },
    });

    for (const item of items) {
      const articleBefore = await this.prisma.article.findUnique({
        where: { id: item.articleId },
        select: {
          id: true,
          reference: true,
          label: true,
          locationId: true,
        },
      });

      await this.prisma.article.update({
        where: { id: item.articleId },
        data: { stock: { decrement: item.quantity } },
      });

      await this.prisma.stockHistory.create({
        data: {
          eventType: 'COMMAND_SHIPMENT',
          quantity: item.quantity,
          articleId: item.articleId,
          articleReference: articleBefore?.reference,
          articleLabel: articleBefore?.label,
          fromLocationId: articleBefore?.locationId,
          commandId: result.id,
          createdByUserId: userId,
          note: `Sortie stock pour commande ${result.reference}`,
        },
      });
    }

    return result;
  }

  /**
   * Retrieve all commands with filters
   * @param status Optional filter by status
   * @param userId Optional filter by user
   * @returns All matching commands
   */
  async findAll(status?: CommandStatus, userId?: number) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const result = await this.prisma.command.findMany({
      where,
      include: {
        items: {
          include: { article: true },
        },
        client: true,
        user: true,
        truck: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return result;
  }

  /**
   * Find a command by id
   * @param id Command's id we want to fetch
   * @returns Command data with items and relations
   */
  async findOne(id: number) {
    await this.findCommandOrThrow(id);

    const result = await this.prisma.command.findUnique({
      where: { id },
      include: {
        items: {
          include: { article: true },
        },
        client: true,
        user: true,
        truck: true,
      },
    });

    return result;
  }

  /**
   * Find a command by reference
   * @param reference The reference to search for
   * @returns The command matching the reference
   */
  async findByReference(reference: string) {
    const command = await this.prisma.command.findUnique({
      where: { reference },
      include: {
        items: {
          include: { article: true },
        },
        client: true,
        user: true,
        truck: true,
      },
    });

    if (!command)
      throw new NotFoundException(`Command #${reference} not found`);

    return command;
  }

  /**
   * Update an existing command
   * @param id Identifier of the command to update
   * @param updateCommandDto Validated data for updating the command
   * @returns The updated command
   */
  async update(id: number, updateCommandDto: UpdateCommandDto) {
    await this.findCommandOrThrow(id);

    if (updateCommandDto.reference) {
      const existingCommand = await this.prisma.command.findUnique({
        where: { reference: updateCommandDto.reference },
      });

      if (existingCommand && existingCommand.id !== id) {
        throw new ConflictException(
          'The reference is already used by another command',
        );
      }
    }

    if (updateCommandDto.clientId) {
      await this.ensureClientExists(updateCommandDto.clientId);
    }

    if (updateCommandDto.userId) {
      await this.ensureUserExists(updateCommandDto.userId);
    }

    if (updateCommandDto.truckId) {
      await this.ensureTruckExists(updateCommandDto.truckId);
    }

    const result = await this.prisma.command.update({
      where: { id },
      data: updateCommandDto,
      include: {
        items: {
          include: { article: true },
        },
        client: true,
        user: true,
        truck: true,
      },
    });

    return result;
  }

  /**
   * Delete a command and restore article stock
   * @param id Identifier of the command to remove
   * @returns The deleted command
   */
  async remove(id: number) {
    await this.findCommandOrThrow(id);

    const items = await this.prisma.commandItem.findMany({
      where: { commandId: id },
    });

    const result = await this.prisma.command.delete({
      where: { id },
      include: {
        items: true,
      },
    });

    for (const item of items) {
      const article = await this.prisma.article.findUnique({
        where: { id: item.articleId },
        select: {
          id: true,
          reference: true,
          label: true,
          locationId: true,
        },
      });

      await this.prisma.article.update({
        where: { id: item.articleId },
        data: { stock: { increment: item.quantity } },
      });

      await this.prisma.stockHistory.create({
        data: {
          eventType: 'COMMAND_REVERT',
          quantity: item.quantity,
          articleId: item.articleId,
          articleReference: article?.reference,
          articleLabel: article?.label,
          toLocationId: article?.locationId,
          commandId: id,
          note: `Restauration stock après suppression commande #${id}`,
        },
      });
    }

    return result;
  }

  /**
   * Update command status
   * @param id Command id
   * @param status New status
   * @returns Updated command
   */
  async updateStatus(id: number, status: CommandStatus) {
    await this.findCommandOrThrow(id);

    const result = await this.prisma.command.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: { article: true },
        },
        client: true,
        user: true,
        truck: true,
      },
    });

    return result;
  }

  /**
   * Get commands by status
   * @param status Status filter
   * @returns Commands matching the status
   */
  async findByStatus(status: CommandStatus) {
    const result = await this.prisma.command.findMany({
      where: { status },
      include: {
        items: {
          include: { article: true },
        },
        client: true,
        user: true,
        truck: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return result;
  }

  /**
   * Get commands by user
   * @param userId User id
   * @returns Commands assigned to user
   */
  async findByUser(userId: number) {
    await this.ensureUserExists(userId);

    const result = await this.prisma.command.findMany({
      where: { userId },
      include: {
        items: {
          include: { article: true },
        },
        client: true,
        user: true,
        truck: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return result;
  }

  /**
   * Get commands by client
   * @param clientId Client id
   * @returns Commands for client
   */
  async findByClient(clientId: number) {
    await this.ensureClientExists(clientId);

    const result = await this.prisma.command.findMany({
      where: { clientId },
      include: {
        items: {
          include: { article: true },
        },
        client: true,
        user: true,
        truck: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return result;
  }

  /**
   * Find command or throw an Exception
   * @param id Id of the command we are looking for
   * @returns Command existence
   */
  private async findCommandOrThrow(id: number) {
    const command = await this.prisma.command.findUnique({
      where: { id },
    });

    if (!command) throw new NotFoundException(`Command #${id} not found`);

    return command;
  }

  /**
   * Check whether a reference is already used
   * @param reference The reference to check
   * @returns True if reference exists, false otherwise
   */
  async doesReferenceExist(reference: string): Promise<boolean> {
    const command = await this.prisma.command.findUnique({
      where: { reference },
    });

    return !!command;
  }

  /**
   * Ensure that a client exists
   * @param clientId The ID of the client to verify
   */
  async ensureClientExists(clientId: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client #${clientId} not found`);
    }
  }

  /**
   * Ensure that a user exists
   * @param userId The ID of the user to verify
   */
  async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }
  }

  /**
   * Ensure that a truck exists
   * @param truckId The ID of the truck to verify
   */
  async ensureTruckExists(truckId: number) {
    const truck = await this.prisma.truck.findUnique({
      where: { id: truckId },
    });

    if (!truck) {
      throw new NotFoundException(`Truck #${truckId} not found`);
    }
  }

  /**
   * Ensure that an article exists
   * @param articleId The ID of the article to verify
   */
  async ensureArticleExists(articleId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException(`Article #${articleId} not found`);
    }
  }
}
