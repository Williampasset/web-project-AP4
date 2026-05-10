import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new client in database
   * @param createClientDto Validated data for client creation
   * @returns Created client
   */
  async create(createClientDto: CreateClientDto) {
    const result = await this.prisma.client.create({
      data: createClientDto,
    });

    return result;
  }

  /**
   * Retrieve all clients in database
   * @returns All clients in database
   */
  async findAll() {
    const result = await this.prisma.client.findMany({
      include: {
        commands: {
          select: {
            id: true,
            reference: true,
            status: true,
            commandDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return result;
  }

  /**
   * Find a client by id
   * @param id Client's id we want to fetch
   * @returns Client data with commands
   */
  async findOne(id: number) {
    await this.findClientOrThrow(id);

    const result = await this.prisma.client.findUnique({
      where: { id },
      include: {
        commands: {
          include: {
            items: {
              include: {
                article: {
                  select: {
                    id: true,
                    reference: true,
                    label: true,
                    price: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            truck: {
              select: {
                id: true,
                imat: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return result;
  }

  /**
   * Find a client by name
   * @param name The name to search for
   * @returns The client matching the name
   */
  async findByName(name: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        name: {
          contains: name.toLocaleLowerCase(),
        },
      },
      include: {
        commands: {
          select: {
            id: true,
            reference: true,
            status: true,
            commandDate: true,
          },
        },
      },
    });

    if (!client) throw new NotFoundException(`Client "${name}" not found`);

    return client;
  }

  /**
   * Update an existing client by id
   * @param id Identifier of the client to update
   * @param updateClientDto Validated data for updating the client
   * @returns The updated client
   */
  async update(id: number, updateClientDto: UpdateClientDto) {
    await this.findClientOrThrow(id);

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  /**
   * Delete a client by id
   * @param id Identifier of the client to remove
   * @returns The deleted client
   */
  async remove(id: number) {
    await this.findClientOrThrow(id);

    return this.prisma.client.delete({ where: { id } });
  }

  /**
   * Get commands count for a client
   * @param id Client id
   * @returns Count of commands for this client
   */
  async countCommands(id: number) {
    await this.findClientOrThrow(id);

    const count = await this.prisma.command.count({
      where: { clientId: id },
    });

    return count;
  }

  /**
   * Get total spent by a client
   * @param id Client id
   * @returns Total amount spent across all delivered commands
   */
  async getTotalSpent(id: number) {
    await this.findClientOrThrow(id);

    const commands = await this.prisma.command.findMany({
      where: {
        clientId: id,
        status: 'DELIVERED',
      },
      include: {
        items: true,
      },
    });

    const total = commands.reduce((sum, command) => {
      const commandTotal = command.items.reduce(
        (itemSum, item) => itemSum + item.quantity * item.unitPrice,
        0,
      );
      return sum + commandTotal;
    }, 0);

    return {
      clientId: id,
      totalSpent: total,
      deliveredCommandsCount: commands.length,
    };
  }

  /**
   * Get client statistics
   * @param id Client id
   * @returns Statistics about client's commands
   */
  async getStatistics(id: number) {
    await this.findClientOrThrow(id);

    const commands = await this.prisma.command.findMany({
      where: { clientId: id },
      include: { items: true },
    });

    const statusCount = {
      WAITING: 0,
      PENDING: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    let totalItems = 0;
    let totalValue = 0;

    commands.forEach((command) => {
      statusCount[command.status]++;
      command.items.forEach((item) => {
        totalItems += item.quantity;
        totalValue += item.quantity * item.unitPrice;
      });
    });

    return {
      clientId: id,
      totalCommands: commands.length,
      statusCount,
      totalItems,
      totalValue,
      averageOrderValue: commands.length > 0 ? totalValue / commands.length : 0,
    };
  }

  /**
   * Find client or throw an Exception
   * @param id Id of the client we are looking for
   * @returns Client data
   */
  private async findClientOrThrow(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) throw new NotFoundException(`Client #${id} not found`);

    return client;
  }
}
