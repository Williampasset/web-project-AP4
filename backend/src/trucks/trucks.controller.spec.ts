import { Test, TestingModule } from '@nestjs/testing';
import { TrucksController } from './trucks.controller';
import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { CommandStatus } from '@prisma/client';

describe('TrucksController', () => {
  let controller: TrucksController;
  let service: TrucksService;

  const mockTruck = {
    id: 1,
    imat: 'AA-123-BB',
    maxLoad: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),

    commands: [
      {
        id: 1,
        reference: 'CMD-001',
        status: CommandStatus.WAITING,
        commandDate: new Date(),

        client: { id: 1, name: 'Acme' },
        user: { id: 1, firstName: 'John', lastName: 'Doe' },

        items: [
          {
            id: 1,
            commandId: 1,
            articleId: 1,
            quantity: 5,
            unitPrice: 10.99,
            article: {
              id: 1,
              reference: 'ART-001',
              label: 'Product A',
              weight: 2.5,
            },
          },
        ],
      },
    ],
  };

  const createTruckDto: CreateTruckDto = {
    imat: 'AA-123-BB',
    maxLoad: 1500,
  };

  const updateTruckDto: UpdateTruckDto = {
    maxLoad: 2000,
  };

  beforeEach(async () => {
    const mockTrucksService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByImat: jest.fn(),
      countCommands: jest.fn(),
      getTotalWeight: jest.fn(),
      checkCapacity: jest.fn(),
      getStatistics: jest.fn(),
      findAvailable: jest.fn(),
      findMostUtilized: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrucksController],
      providers: [
        {
          provide: TrucksService,
          useValue: mockTrucksService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<TrucksController>(TrucksController);
    service = module.get<TrucksService>(TrucksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a truck and return it', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockTruck);

      const result = await controller.create(createTruckDto);

      expect(result).toEqual(mockTruck);
      expect(service.create).toHaveBeenCalledWith(createTruckDto);
    });
  });

  describe('findAll', () => {
    it('should return all trucks', async () => {
      const mockTrucks = [mockTruck];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockTrucks);

      const result = await controller.findAll();

      expect(result).toEqual(mockTrucks);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty list when no trucks exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a truck by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTruck as any);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockTruck);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw error when truck is not found', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new Error('Truck not found'));

      await expect(controller.findOne(999)).rejects.toThrow('Truck not found');
    });
  });

  describe('findByImat', () => {
    it('should return a truck by IMAT', async () => {
      jest.spyOn(service, 'findByImat').mockResolvedValue(mockTruck);

      const result = await controller.findByImat('AA-123-BB');

      expect(result).toEqual(mockTruck);
      expect(service.findByImat).toHaveBeenCalledWith('AA-123-BB');
    });

    it('should throw error when IMAT is not found', async () => {
      jest
        .spyOn(service, 'findByImat')
        .mockRejectedValue(new Error('Truck not found'));

      await expect(controller.findByImat('INVALID')).rejects.toThrow(
        'Truck not found',
      );
    });
  });

  describe('countCommands', () => {
    it('should return commands count for a truck', async () => {
      jest.spyOn(service, 'countCommands').mockResolvedValue(5);

      const result = await controller.countCommands(1);

      expect(result).toEqual({ truckId: 1, commandsCount: 5 });
      expect(service.countCommands).toHaveBeenCalledWith(1);
    });

    it('should throw error when truck is not found', async () => {
      jest
        .spyOn(service, 'countCommands')
        .mockRejectedValue(new Error('Truck not found'));

      await expect(controller.countCommands(999)).rejects.toThrow(
        'Truck not found',
      );
    });
  });

  describe('getTotalWeight', () => {
    it('should return total weight of cargo', async () => {
      jest.spyOn(service, 'getTotalWeight').mockResolvedValue(550.5);

      const result = await controller.getTotalWeight(1);

      expect(result).toEqual({ truckId: 1, totalWeight: 550.5 });
      expect(service.getTotalWeight).toHaveBeenCalledWith(1);
    });
  });

  describe('checkCapacity', () => {
    it('should return capacity information', async () => {
      const capacityInfo = {
        truckId: 1,
        maxCapacity: 1500,
        currentWeight: 550.5,
        additionalWeight: 100,
        totalWeight: 650.5,
        availableCapacity: 949.5,
        canCarry: true,
      };

      jest.spyOn(service, 'checkCapacity').mockResolvedValue(capacityInfo);

      const result = await controller.checkCapacity(1, '100');

      expect(result).toEqual(capacityInfo);
      expect(service.checkCapacity).toHaveBeenCalledWith(1, 100);
    });

    it('should use default additionalWeight of 0', async () => {
      const capacityInfo = {
        truckId: 1,
        maxCapacity: 1500,
        currentWeight: 550.5,
        additionalWeight: 0,
        totalWeight: 550.5,
        availableCapacity: 949.5,
        canCarry: true,
      };

      jest.spyOn(service, 'checkCapacity').mockResolvedValue(capacityInfo);

      await controller.checkCapacity(1);

      expect(service.checkCapacity).toHaveBeenCalledWith(1, 0);
    });
  });

  describe('getStatistics', () => {
    it('should return truck statistics', async () => {
      const stats = {
        truckId: 1,
        imat: 'AA-123-BB',
        maxCapacity: 1500,
        totalCommands: 10,
        statusCount: {
          WAITING: 2,
          PENDING: 3,
          DELIVERED: 4,
          CANCELLED: 1,
        },
        totalWeight: 550.5,
        totalItems: 50,
        totalValue: 549.5,
        averageCommandValue: 54.95,
        utilizationPercentage: 36.7,
      };

      jest.spyOn(service, 'getStatistics').mockResolvedValue(stats);

      const result = await controller.getStatistics(1);

      expect(result).toEqual(stats);
      expect(service.getStatistics).toHaveBeenCalledWith(1);
    });
  });

  describe('findAvailable', () => {
    it('should return available trucks', async () => {
      const availableTrucks = [mockTruck];
      jest.spyOn(service, 'findAvailable').mockResolvedValue(availableTrucks);

      const result = await controller.findAvailable();

      expect(result).toEqual(availableTrucks);
      expect(service.findAvailable).toHaveBeenCalled();
    });
  });

  describe('findMostUtilized', () => {
    it('should return trucks sorted by utilization', async () => {
      const utilizationTrucks = [
        {
          ...mockTruck,
          currentWeight: 1100,
          utilizationPercentage: 73.33,
        },
      ];

      jest
        .spyOn(service, 'findMostUtilized')
        .mockResolvedValue(utilizationTrucks as any);

      const result = await controller.findMostUtilized();

      expect(result).toEqual(utilizationTrucks);
      expect(service.findMostUtilized).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a truck', async () => {
      const updatedTruck = { ...mockTruck, maxLoad: 2000 };
      jest.spyOn(service, 'update').mockResolvedValue(updatedTruck);

      const result = await controller.update(1, updateTruckDto);

      expect(result).toEqual(updatedTruck);
      expect(service.update).toHaveBeenCalledWith(1, updateTruckDto);
    });

    it('should throw error when truck is not found', async () => {
      jest
        .spyOn(service, 'update')
        .mockRejectedValue(new Error('Truck not found'));

      await expect(controller.update(999, updateTruckDto)).rejects.toThrow(
        'Truck not found',
      );
    });
  });

  describe('remove', () => {
    it('should delete a truck', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockTruck);

      const result = await controller.remove(1);

      expect(result).toEqual(mockTruck);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw error when truck is not found', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValue(new Error('Truck not found'));

      await expect(controller.remove(999)).rejects.toThrow('Truck not found');
    });
  });
});
