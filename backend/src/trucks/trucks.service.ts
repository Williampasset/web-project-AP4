import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TrucksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new truck in database
   * @param createTruckDto Validated data for truck creation
   * @returns Created truck
   */
  async create(createTruckDto: CreateTruckDto) {
    if (await this.doesImatExist(createTruckDto.imat)) {
      throw new ConflictException('The IMAT is already used by another truck');
    }

    const result = await this.prisma.truck.create({
      data: createTruckDto,
    });

    return result;
  }

  /**
   * Retrieve all trucks in database
   * @returns All trucks with commands summary
   */
  async findAll() {
    const result = await this.prisma.truck.findMany({
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
   * Find a truck by id
   * @param id Truck's id we want to fetch
   * @returns Truck data with commands
   */
  async findOne(id: number) {
    const truck = await this.findTruckOrThrow(id);

    const result = await this.prisma.truck.findUnique({
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
                    weight: true,
                  },
                },
              },
            },
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
   * Find a truck by IMAT
   * @param imat The IMAT to search for
   * @returns The truck matching the IMAT
   */
  async findByImat(imat: string) {
    const truck = await this.prisma.truck.findUnique({
      where: { imat },
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

    if (!truck) throw new NotFoundException(`Truck "${imat}" not found`);

    return truck;
  }

  /**
   * Update an existing truck by id
   * @param id Identifier of the truck to update
   * @param updateTruckDto Validated data for updating the truck
   * @returns The updated truck
   */
  async update(id: number, updateTruckDto: UpdateTruckDto) {
    await this.findTruckOrThrow(id);

    if (updateTruckDto.imat) {
      const existingTruck = await this.prisma.truck.findUnique({
        where: { imat: updateTruckDto.imat },
      });

      if (existingTruck && existingTruck.id !== id) {
        throw new ConflictException(
          'The IMAT is already used by another truck',
        );
      }
    }

    return this.prisma.truck.update({
      where: { id },
      data: updateTruckDto,
    });
  }

  /**
   * Delete a truck by id
   * @param id Identifier of the truck to remove
   * @returns The deleted truck
   */
  async remove(id: number) {
    await this.findTruckOrThrow(id);

    return this.prisma.truck.delete({ where: { id } });
  }

  /**
   * Get commands count for a truck
   * @param id Truck id
   * @returns Count of commands for this truck
   */
  async countCommands(id: number) {
    await this.findTruckOrThrow(id);

    const count = await this.prisma.command.count({
      where: { truckId: id },
    });

    return count;
  }

  /**
   * Get total weight of items in current/pending commands
   * @param id Truck id
   * @returns Total weight of items being transported
   */
  async getTotalWeight(id: number) {
    await this.findTruckOrThrow(id);

    const commands = await this.prisma.command.findMany({
      where: {
        truckId: id,
        status: { in: ['WAITING', 'PENDING', 'READY'] },
      },
      include: {
        items: {
          include: {
            article: {
              select: { weight: true },
            },
          },
        },
      },
    });

    const totalWeight = commands.reduce((sum, command) => {
      const commandWeight = command.items.reduce(
        (itemSum, item) => itemSum + item.quantity * item.article.weight,
        0,
      );
      return sum + commandWeight;
    }, 0);

    return totalWeight;
  }

  /**
   * Check if truck can carry additional weight
   * @param id Truck id
   * @param additionalWeight Weight to be added
   * @returns Object with capacity info
   */
  async checkCapacity(id: number, additionalWeight: number) {
    const truck = await this.findTruckOrThrow(id);
    const currentWeight = await this.getTotalWeight(id);
    const totalWeight = currentWeight + additionalWeight;
    const available = truck.maxLoad - currentWeight;

    return {
      truckId: id,
      maxCapacity: truck.maxLoad,
      currentWeight,
      additionalWeight,
      totalWeight,
      availableCapacity: available,
      canCarry: totalWeight <= truck.maxLoad,
    };
  }

  /**
   * Get truck statistics
   * @param id Truck id
   * @returns Statistics about truck's usage
   */
  async getStatistics(id: number) {
    const truck = await this.findTruckOrThrow(id);

    const commands = await this.prisma.command.findMany({
      where: { truckId: id },
      include: {
        items: {
          include: {
            article: {
              select: { weight: true },
            },
          },
        },
      },
    });

    const statusCount = {
      WAITING: 0,
      PENDING: 0,
      READY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    let totalWeight = 0;
    let totalItems = 0;
    let totalValue = 0;

    commands.forEach((command) => {
      statusCount[command.status]++;
      command.items.forEach((item) => {
        totalWeight += item.quantity * item.article.weight;
        totalItems += item.quantity;
        totalValue += item.quantity * item.unitPrice;
      });
    });

    return {
      truckId: id,
      imat: truck.imat,
      maxCapacity: truck.maxLoad,
      totalCommands: commands.length,
      statusCount,
      totalWeight,
      totalItems,
      totalValue,
      averageCommandValue:
        commands.length > 0 ? totalValue / commands.length : 0,
      utilizationPercentage:
        truck.maxLoad > 0 ? (totalWeight / truck.maxLoad) * 100 : 0,
    };
  }

  /**
   * Find available trucks (not currently assigned to any command)
   * @returns List of available trucks
   */
  async findAvailable() {
    const result = await this.prisma.truck.findMany({
      where: {
        commands: {
          none: {
            status: { in: ['WAITING', 'PENDING', 'READY'] },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return result;
  }

  /**
   * Get trucks sorted by utilization (highest to lowest)
   * @returns Trucks with utilization percentage
   */
  async findMostUtilized() {
    const trucks = await this.prisma.truck.findMany({
      include: {
        commands: {
          where: { status: { in: ['WAITING', 'PENDING', 'READY'] } },
          include: {
            items: {
              include: {
                article: {
                  select: { weight: true },
                },
              },
            },
          },
        },
      },
    });

    const withUtilization = trucks
      .map((truck) => {
        const totalWeight = truck.commands.reduce((sum, command) => {
          const commandWeight = command.items.reduce(
            (itemSum, item) => itemSum + item.quantity * item.article.weight,
            0,
          );
          return sum + commandWeight;
        }, 0);

        return {
          ...truck,
          currentWeight: totalWeight,
          utilizationPercentage:
            truck.maxLoad > 0 ? (totalWeight / truck.maxLoad) * 100 : 0,
        };
      })
      .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    return withUtilization;
  }

  /**
   * Check whether an IMAT is already used
   * @param imat The IMAT to check
   * @returns True if IMAT exists, false otherwise
   */
  async doesImatExist(imat: string): Promise<boolean> {
    const truck = await this.prisma.truck.findUnique({
      where: { imat },
    });

    return !!truck;
  }

  /**
   * Find truck or throw an Exception
   * @param id Id of the truck we are looking for
   * @returns Truck data
   */
  private async findTruckOrThrow(id: number) {
    const truck = await this.prisma.truck.findUnique({
      where: { id },
    });

    if (!truck) throw new NotFoundException(`Truck #${id} not found`);

    return truck;
  }
}
