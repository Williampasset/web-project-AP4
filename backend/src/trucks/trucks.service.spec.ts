import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { PrismaService } from '../prisma.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { CommandStatus } from '@prisma/client';

describe('TrucksService', () => {
  let service: TrucksService;
  let prisma: PrismaService;

  const mockTruck = {
    id: 1,
    imat: 'AA-123-BB',
    maxLoad: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createTruckDto: CreateTruckDto = {
    imat: 'AA-123-BB',
    maxLoad: 1500,
  };

  const updateTruckDto: UpdateTruckDto = {
    maxLoad: 2000,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      truck: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      command: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrucksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TrucksService>(TrucksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a truck', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.truck, 'create').mockResolvedValue(mockTruck);

      const result = await service.create(createTruckDto);

      expect(result).toEqual(mockTruck);
      expect(prisma.truck.create).toHaveBeenCalledWith({
        data: createTruckDto,
      });
    });

    it('should throw ConflictException if IMAT already exists', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);

      await expect(service.create(createTruckDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.truck.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all trucks with commands', async () => {
      const mockTrucks = [
        {
          ...mockTruck,
          commands: [
            {
              id: 1,
              reference: 'CMD-001',
              status: 'WAITING',
              commandDate: new Date(),
            },
          ],
        },
      ];

      jest.spyOn(prisma.truck, 'findMany').mockResolvedValue(mockTrucks);

      const result = await service.findAll();

      expect(result).toEqual(mockTrucks);
      expect(prisma.truck.findMany).toHaveBeenCalled();
    });

    it('should return empty list if no trucks exist', async () => {
      jest.spyOn(prisma.truck, 'findMany').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a truck with all commands', async () => {
      const fullTruck = {
        ...mockTruck,
        commands: [
          {
            id: 1,
            reference: 'CMD-001',
            status: 'WAITING',
            items: [
              {
                id: 1,
                quantity: 5,
                unitPrice: 10.99,
                article: {
                  id: 1,
                  reference: 'ART-001',
                  label: 'Product A',
                  weight: 220.5,
                },
              },
            ],
            client: {
              id: 1,
              name: 'Client ABC',
            },
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        ],
      };

      jest
        .spyOn(prisma.truck, 'findUnique')
        .mockResolvedValueOnce(mockTruck)
        .mockResolvedValueOnce(fullTruck);

      const result = await service.findOne(1);

      expect(result).toEqual(fullTruck);
    });

    it('should throw NotFoundException if truck does not exist', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByImat', () => {
    it('should return a truck by IMAT', async () => {
      const truckWithCommands = {
        ...mockTruck,
        commands: [
          {
            id: 1,
            reference: 'CMD-001',
            status: 'WAITING',
            commandDate: new Date(),
          },
        ],
      };

      jest
        .spyOn(prisma.truck, 'findUnique')
        .mockResolvedValue(truckWithCommands);

      const result = await service.findByImat('AA-123-BB');

      expect(result).toEqual(truckWithCommands);
      expect(prisma.truck.findUnique).toHaveBeenCalledWith({
        where: { imat: 'AA-123-BB' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if IMAT not found', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(null);

      await expect(service.findByImat('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update a truck', async () => {
      const updatedTruck = { ...mockTruck, ...updateTruckDto };

      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.truck, 'update').mockResolvedValue(updatedTruck);

      const result = await service.update(1, updateTruckDto);

      expect(result).toEqual(updatedTruck);
      expect(prisma.truck.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateTruckDto,
      });
    });

    it('should throw NotFoundException if truck does not exist', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(null);

      await expect(service.update(999, updateTruckDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.truck.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if new IMAT already exists', async () => {
      const updateWithImat: UpdateTruckDto = { imat: 'BB-456-CC' };
      const anotherTruck = { ...mockTruck, id: 2, imat: 'BB-456-CC' };

      jest
        .spyOn(prisma.truck, 'findUnique')
        .mockResolvedValueOnce(mockTruck)
        .mockResolvedValueOnce(anotherTruck);

      await expect(service.update(1, updateWithImat)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should successfully delete a truck', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.truck, 'delete').mockResolvedValue(mockTruck);

      const result = await service.remove(1);

      expect(result).toEqual(mockTruck);
      expect(prisma.truck.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if truck does not exist', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(prisma.truck.delete).not.toHaveBeenCalled();
    });
  });

  describe('countCommands', () => {
    it('should return count of commands for a truck', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.command, 'count').mockResolvedValue(5);

      const result = await service.countCommands(1);

      expect(result).toBe(5);
      expect(prisma.command.count).toHaveBeenCalledWith({
        where: { truckId: 1 },
      });
    });
  });

  describe('getTotalWeight', () => {
    it('should return total weight of cargo', async () => {
      const mockCommands = [
        {
          id: 1,
          reference: 'CMD-001',
          clientId: 1,
          userId: 1,
          truckId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: CommandStatus.DELIVERED,
          commandDate: new Date(),
          deliveryDate: new Date(),
          items: [
            {
              quantity: 5,
              unitPrice: 10.99,
              article: {
                weight: 10,
              },
            },
            {
              quantity: 3,
              unitPrice: 20.5,
              article: {
                weight: 10,
              },
            },
          ],
        },
        {
          id: 2,
          reference: 'CMD-002',
          clientId: 2,
          userId: 1,
          truckId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: CommandStatus.DELIVERED,
          commandDate: new Date(),
          deliveryDate: new Date(),
          items: [
            {
              quantity: 2,
              unitPrice: 15.0,
              article: {
                weight: 10,
              },
            },
          ],
        },
      ];

      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.getTotalWeight(1);

      expect(result).toBe(2 * 10 + 8 * 10);
    });

    it('should return 0 if no WAITING or PENDING commands', async () => {
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue([]);

      const result = await service.getTotalWeight(1);

      expect(result).toBe(0);
    });
  });

  describe('checkCapacity', () => {
    it('should return capacity info', async () => {
      const mockCommands = [
        {
          id: 1,
          reference: 'CMD-001',
          clientId: 1,
          userId: 1,
          truckId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: CommandStatus.DELIVERED,
          commandDate: new Date(),
          deliveryDate: new Date(),
          items: [
            {
              quantity: 5,
              unitPrice: 10.99,
              article: {
                weight: 10,
              },
            },
            {
              quantity: 3,
              unitPrice: 20.5,
              article: {
                weight: 10,
              },
            },
          ],
        },
      ];

      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.checkCapacity(1, 200);

      expect(result).toEqual({
        truckId: 1,
        maxCapacity: 1500,
        currentWeight: 80,
        additionalWeight: 200,
        totalWeight: 280,
        availableCapacity: 1420,
        canCarry: true,
      });
    });

    it('should return canCarry true if under capacity', async () => {
      const mockCommands = [
        {
          id: 1,
          reference: 'CMD-001',
          clientId: 1,
          userId: 1,
          truckId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: CommandStatus.DELIVERED,
          commandDate: new Date(),
          deliveryDate: new Date(),
          items: [
            {
              quantity: 5,
              unitPrice: 10.99,
              article: {
                weight: 10,
              },
            },
            {
              quantity: 3,
              unitPrice: 20.5,
              article: {
                weight: 10,
              },
            },
          ],
        },
      ];

      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.checkCapacity(1, 1000);

      expect(result.canCarry).toBe(true);
      expect(result.totalWeight).toBe(1080);
    });
  });

  describe('getStatistics', () => {
    it('should return comprehensive truck statistics', async () => {
      const mockCommands = [
        {
          id: 1,
          reference: 'CMD-001',
          clientId: 1,
          userId: 1,
          truckId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: CommandStatus.DELIVERED,
          commandDate: new Date(),
          deliveryDate: new Date(),
          items: [
            {
              quantity: 5,
              unitPrice: 10.99,
              article: {
                weight: 10,
              },
            },
            {
              quantity: 3,
              unitPrice: 20.5,
              article: {
                weight: 10,
              },
            },
          ],
        },
        {
          id: 2,
          reference: 'CMD-002',
          clientId: 2,
          userId: 1,
          truckId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: CommandStatus.DELIVERED,
          commandDate: new Date(),
          deliveryDate: new Date(),
          items: [
            {
              quantity: 2,
              unitPrice: 15.0,
              article: {
                weight: 10,
              },
            },
          ],
        },
      ];

      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.getStatistics(1);

      expect(result).toEqual({
        truckId: 1,
        imat: 'AA-123-BB',
        maxCapacity: 1500,
        totalCommands: 2,
        statusCount: {
          WAITING: 0,
          PENDING: 0,
          DELIVERED: 2,
          CANCELLED: 0,
        },
        totalWeight: expect.any(Number),
        totalItems: 10,
        totalValue: expect.any(Number),
        averageCommandValue: expect.any(Number),
        utilizationPercentage: expect.any(Number),
      });
    });
  });

  describe('findAvailable', () => {
    it('should return trucks not assigned to WAITING/PENDING commands', async () => {
      const availableTruck = mockTruck;
      jest.spyOn(prisma.truck, 'findMany').mockResolvedValue([availableTruck]);

      const result = await service.findAvailable();

      expect(result).toEqual([availableTruck]);
    });
  });

  describe('findMostUtilized', () => {
    it('should return trucks sorted by utilization', async () => {
      const mockTrucksWithCommands = [
        {
          ...mockTruck,
          commands: [
            {
              id: 1,
              status: 'WAITING',
              items: [
                {
                  quantity: 5,
                  article: { weight: 200 },
                },
              ],
            },
          ],
        },
      ];

      jest
        .spyOn(prisma.truck, 'findMany')
        .mockResolvedValue(mockTrucksWithCommands);

      const result = await service.findMostUtilized();

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            utilizationPercentage: expect.any(Number),
          }),
        ]),
      );
    });
  });
});
