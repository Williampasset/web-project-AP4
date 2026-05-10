import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CommandsService } from './commands.service';
import { PrismaService } from '../prisma.service';
import { CreateCommandDto } from './dto/create-command.dto';
import { UpdateCommandDto } from './dto/update-command.dto';
import { CommandStatus } from './enums/command-status.enum';
import { UserRole } from '@prisma/client';

describe('CommandsService', () => {
  let service: CommandsService;
  let prisma: PrismaService;

  const mockUser = {
    id: 1,
    matricule: 'USR001',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed',
    role: UserRole.MAGASINIER,
    managerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClient = {
    id: 1,
    name: 'Client ABC',
    address: '123 Street',
    email: 'client@example.com',
    phone: '+33123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTruck = {
    id: 1,
    imat: 'AA-123-BB',
    maxLoad: 1000,
    maxVolume: 50,
    maintenanceEndAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    commands: [],
    trips: [],
  };

  const mockArticle = {
    id: 1,
    reference: 'ART-001',
    label: 'Test Article',
    weight: 220.5,
    volume: 1.2,
    price: 10.99,
    stock: 100,
    locationId: 1,
    supplierId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCommand = {
    id: 1,
    reference: 'CMD-001',
    status: CommandStatus.WAITING,
    commandDate: new Date(),
    deliveryDate: null,
    clientId: 1,
    truckId: 1,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCommandItem = {
    id: 1,
    commandId: 1,
    articleId: 1,
    quantity: 5,
    unitPrice: 10.99,
  };

  const createCommandDto: CreateCommandDto = {
    reference: 'CMD-001',
    clientId: 1,
    userId: 1,
    truckId: 1,
    items: [
      {
        articleId: 1,
        quantity: 5,
        unitPrice: 10.99,
      },
    ],
  };

  const updateCommandDto: UpdateCommandDto = {
    status: CommandStatus.PENDING,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      command: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      commandItem: {
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      client: {
        findUnique: jest.fn(),
      },
      truck: {
        findUnique: jest.fn(),
      },
      article: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      stockHistory: {
        create: jest.fn(),
      },
      trip: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommandsService>(CommandsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a command with items', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(mockArticle);
      jest.spyOn(prisma.command, 'create').mockResolvedValue({
        ...mockCommand,
      });
      jest.spyOn(prisma.article, 'update').mockResolvedValue({
        ...mockArticle,
        stock: mockArticle.stock - createCommandDto.items[0].quantity,
      });
      jest.spyOn(prisma.stockHistory, 'create').mockResolvedValue({
        id: 1,
        eventType: 'SUPPLIER_INBOUND',
        quantity: 1,

        articleId: null,
        articleReference: null,
        articleLabel: null,

        fromLocationId: null,
        toLocationId: null,

        supplierId: null,
        commandId: null,
        stockJobId: null,

        note: null,
        createdByUserId: null,

        createdAt: new Date(),
      });

      const result = await service.create(createCommandDto);

      expect(result).toEqual(expect.objectContaining(mockCommand));
      expect(prisma.command.create).toHaveBeenCalled();
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { decrement: 5 } },
      });
    });

    it('should throw ConflictException if reference already exists', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(mockCommand);

      await expect(service.create(createCommandDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if client does not exist', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(null);

      await expect(service.create(createCommandDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.create(createCommandDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if article stock is insufficient', async () => {
      const lowStockArticle = { ...mockArticle, stock: 2 };
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.truck, 'findUnique').mockResolvedValue(mockTruck);
      jest
        .spyOn(prisma.article, 'findUnique')
        .mockResolvedValue(lowStockArticle);

      await expect(service.create(createCommandDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all commands with items', async () => {
      const mockCommands = [
        {
          ...mockCommand,
          items: [mockCommandItem],
          client: mockClient,
          user: mockUser,
          truck: mockTruck,
        },
      ];

      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.findAll();

      expect(result).toEqual(mockCommands);
      expect(prisma.command.findMany).toHaveBeenCalled();
    });

    it('should filter commands by status', async () => {
      const mockCommands = [
        {
          ...mockCommand,
          status: CommandStatus.PENDING,
          items: [mockCommandItem],
          client: mockClient,
          user: mockUser,
          truck: mockTruck,
        },
      ];

      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.findAll(CommandStatus.PENDING);

      expect(result).toEqual(mockCommands);
      expect(prisma.command.findMany).toHaveBeenCalledWith({
        where: { status: CommandStatus.PENDING },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });

    it('should filter commands by userId', async () => {
      const mockCommands = [
        {
          ...mockCommand,
          items: [mockCommandItem],
          client: mockClient,
          user: mockUser,
          truck: mockTruck,
        },
      ];

      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.findAll(undefined, 1);

      expect(result).toEqual(mockCommands);
      expect(prisma.command.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a command with all relations', async () => {
      const fullCommand = {
        ...mockCommand,
        items: [mockCommandItem],
        client: mockClient,
        user: mockUser,
        truck: mockTruck,
      };

      jest
        .spyOn(prisma.command, 'findUnique')
        .mockResolvedValueOnce(mockCommand)
        .mockResolvedValueOnce(fullCommand);

      const result = await service.findOne(1);

      expect(result).toEqual(fullCommand);
    });

    it('should throw NotFoundException if command does not exist', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByReference', () => {
    it('should return a command by reference', async () => {
      const fullCommand = {
        ...mockCommand,
        items: [mockCommandItem],
        client: mockClient,
        user: mockUser,
        truck: mockTruck,
      };

      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(fullCommand);

      const result = await service.findByReference('CMD-001');

      expect(result).toEqual(fullCommand);
    });

    it('should throw NotFoundException if reference not found', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(null);

      await expect(service.findByReference('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update command status', async () => {
      const updatedCommand = {
        ...mockCommand,
        status: CommandStatus.PENDING,
        items: [mockCommandItem],
        client: mockClient,
        user: mockUser,
        truck: mockTruck,
      };

      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(mockCommand);
      jest.spyOn(prisma.command, 'update').mockResolvedValue(updatedCommand);

      const result = await service.update(1, updateCommandDto);

      expect(result.status).toEqual(CommandStatus.PENDING);
      expect(prisma.command.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if command does not exist', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(null);

      await expect(service.update(999, updateCommandDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new reference already exists', async () => {
      const updateWithReference: UpdateCommandDto = {
        reference: 'CMD-002',
      };
      const anotherCommand = { ...mockCommand, id: 2, reference: 'CMD-002' };

      jest
        .spyOn(prisma.command, 'findUnique')
        .mockResolvedValueOnce(mockCommand)
        .mockResolvedValueOnce(anotherCommand);

      await expect(service.update(1, updateWithReference)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete command and restore stock', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(mockCommand);
      jest
        .spyOn(prisma.commandItem, 'findMany')
        .mockResolvedValue([mockCommandItem]);
      jest.spyOn(prisma.command, 'delete').mockResolvedValue({
        ...mockCommand,
      });
      jest.spyOn(prisma.stockHistory, 'create').mockResolvedValue({
        id: 1,
        eventType: 'SUPPLIER_INBOUND',
        quantity: 1,

        articleId: null,
        articleReference: null,
        articleLabel: null,

        fromLocationId: null,
        toLocationId: null,

        supplierId: null,
        commandId: null,
        stockJobId: null,

        note: null,
        createdByUserId: null,

        createdAt: new Date(),
      });

      const result = await service.remove(1);

      expect(result).toEqual(expect.objectContaining(mockCommand));
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { increment: 5 } },
      });
    });

    it('should throw NotFoundException if command does not exist', async () => {
      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update only the status', async () => {
      const updatedCommand = {
        ...mockCommand,
        status: CommandStatus.DELIVERED,
        items: [mockCommandItem],
        client: mockClient,
        user: mockUser,
        truck: mockTruck,
      };

      jest.spyOn(prisma.command, 'findUnique').mockResolvedValue(mockCommand);
      jest.spyOn(prisma.command, 'update').mockResolvedValue(updatedCommand);

      const result = await service.updateStatus(1, CommandStatus.DELIVERED);

      expect(result.status).toEqual(CommandStatus.DELIVERED);
      expect(prisma.command.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: CommandStatus.DELIVERED },
        include: expect.any(Object),
      });
    });
  });

  describe('findByStatus', () => {
    it('should return commands filtered by status', async () => {
      const mockCommands = [
        {
          ...mockCommand,
          status: CommandStatus.PENDING,
          items: [mockCommandItem],
          client: mockClient,
          user: mockUser,
          truck: mockTruck,
        },
      ];

      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.findByStatus(CommandStatus.PENDING);

      expect(result).toEqual(mockCommands);
    });
  });

  describe('findByUser', () => {
    it('should return commands for a specific user', async () => {
      const mockCommands = [
        {
          ...mockCommand,
          items: [mockCommandItem],
          client: mockClient,
          user: mockUser,
          truck: mockTruck,
        },
      ];

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.findByUser(1);

      expect(result).toEqual(mockCommands);
    });
  });

  describe('findByClient', () => {
    it('should return commands for a specific client', async () => {
      const mockCommands = [
        {
          ...mockCommand,
          items: [mockCommandItem],
          client: mockClient,
          user: mockUser,
          truck: mockTruck,
        },
      ];

      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.findByClient(1);

      expect(result).toEqual(mockCommands);
    });
  });
});
