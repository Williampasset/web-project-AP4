import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CommandStatus } from '@prisma/client';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  const mockClient = {
    id: 1,
    name: 'Acme Corporation',
    address: '123 Business Street, Paris, 75000',
    email: 'contact@acme.com',
    phone: '+33123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createClientDto: CreateClientDto = {
    name: 'Acme Corporation',
    address: '123 Business Street, Paris, 75000',
    email: 'contact@acme.com',
    phone: '+33123456789',
  };

  const updateClientDto: UpdateClientDto = {
    name: 'Acme Corporation Updated',
    phone: '+33987654321',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      client: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
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
        ClientsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a client', async () => {
      jest.spyOn(prisma.client, 'create').mockResolvedValue(mockClient);

      const result = await service.create(createClientDto);

      expect(result).toEqual(mockClient);
      expect(prisma.client.create).toHaveBeenCalledWith({
        data: createClientDto,
      });
    });

    it('should create client with minimal required fields', async () => {
      const minimalDto: CreateClientDto = {
        name: 'Simple Client',
        address: '456 Avenue Main',
      };

      jest.spyOn(prisma.client, 'create').mockResolvedValue({
        ...mockClient,
        ...minimalDto,
        email: null,
        phone: null,
      });

      const result = await service.create(minimalDto);

      expect(result).toEqual(expect.objectContaining(minimalDto));
      expect(prisma.client.create).toHaveBeenCalledWith({
        data: minimalDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all clients with commands summary', async () => {
      const mockClients = [
        {
          ...mockClient,
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

      jest.spyOn(prisma.client, 'findMany').mockResolvedValue(mockClients);

      const result = await service.findAll();

      expect(result).toEqual(mockClients);
      expect(prisma.client.findMany).toHaveBeenCalled();
    });

    it('should return empty list if no clients exist', async () => {
      jest.spyOn(prisma.client, 'findMany').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a client with all commands', async () => {
      const fullClient = {
        ...mockClient,
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
                  price: 10.99,
                },
              },
            ],
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
            },
            truck: {
              id: 1,
              imat: 'AA-123-BB',
            },
          },
        ],
      };

      jest
        .spyOn(prisma.client, 'findUnique')
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(fullClient);

      const result = await service.findOne(1);

      expect(result).toEqual(fullClient);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    it('should return a client by name', async () => {
      const clientWithCommands = {
        ...mockClient,
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
        .spyOn(prisma.client, 'findFirst')
        .mockResolvedValue(clientWithCommands);

      const result = await service.findByName('Acme');

      expect(result).toEqual(clientWithCommands);
      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'acme',
          },
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if client name not found', async () => {
      jest.spyOn(prisma.client, 'findFirst').mockResolvedValue(null);

      await expect(service.findByName('Nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should perform case-insensitive search', async () => {
      const clientWithCommands = {
        ...mockClient,
        commands: [],
      };

      jest
        .spyOn(prisma.client, 'findFirst')
        .mockResolvedValue(clientWithCommands);

      await service.findByName('acme corporation');

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'acme corporation',
          },
        },
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should successfully update a client', async () => {
      const updatedClient = { ...mockClient, ...updateClientDto };

      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.client, 'update').mockResolvedValue(updatedClient);

      const result = await service.update(1, updateClientDto);

      expect(result).toEqual(updatedClient);
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateClientDto,
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(null);

      await expect(service.update(999, updateClientDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('should allow partial updates', async () => {
      const partialUpdate: UpdateClientDto = { email: 'newemail@acme.com' };
      const updatedClient = { ...mockClient, ...partialUpdate };

      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.client, 'update').mockResolvedValue(updatedClient);

      const result = await service.update(1, partialUpdate);

      expect(result).toEqual(updatedClient);
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: partialUpdate,
      });
    });
  });

  describe('remove', () => {
    it('should successfully delete a client', async () => {
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.client, 'delete').mockResolvedValue(mockClient);

      const result = await service.remove(1);

      expect(result).toEqual(mockClient);
      expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(prisma.client.delete).not.toHaveBeenCalled();
    });
  });

  describe('countCommands', () => {
    it('should return count of commands for a client', async () => {
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.command, 'count').mockResolvedValue(5);

      const result = await service.countCommands(1);

      expect(result).toBe(5);
      expect(prisma.command.count).toHaveBeenCalledWith({
        where: { clientId: 1 },
      });
    });

    it('should return 0 if client has no commands', async () => {
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.command, 'count').mockResolvedValue(0);

      const result = await service.countCommands(1);

      expect(result).toBe(0);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(null);

      await expect(service.countCommands(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.command.count).not.toHaveBeenCalled();
    });
  });

  describe('getTotalSpent', () => {
    it('should return total spent by client', async () => {
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
            { quantity: 5, unitPrice: 10.99 },
            { quantity: 3, unitPrice: 20.5 },
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
          items: [{ quantity: 2, unitPrice: 15.0 }],
        },
      ];

      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.getTotalSpent(1);

      expect(result).toEqual({
        clientId: 1,
        totalSpent: 5 * 10.99 + 3 * 20.5 + 2 * 15.0,
        deliveredCommandsCount: 2,
      });
    });

    it('should return 0 if no delivered commands', async () => {
      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue([]);

      const result = await service.getTotalSpent(1);

      expect(result).toEqual({
        clientId: 1,
        totalSpent: 0,
        deliveredCommandsCount: 0,
      });
    });
  });

  describe('getStatistics', () => {
    it('should return comprehensive client statistics', async () => {
      const baseCommand = {
        reference: 'MOCK',
        clientId: 1,
        userId: 1,
        truckId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        commandDate: new Date(),
        deliveryDate: new Date(),
      };

      const mockCommands = [
        {
          ...baseCommand,
          id: 1,
          status: CommandStatus.WAITING,
          items: [{ quantity: 5, unitPrice: 10.99 }],
        },
        {
          ...baseCommand,
          id: 2,
          status: CommandStatus.PENDING,
          items: [{ quantity: 3, unitPrice: 20.5 }],
        },
        {
          ...baseCommand,
          id: 3,
          status: CommandStatus.DELIVERED,
          items: [
            { quantity: 2, unitPrice: 15.0 },
            { quantity: 4, unitPrice: 12.5 },
          ],
        },
        {
          ...baseCommand,
          id: 4,
          status: CommandStatus.CANCELLED,
          items: [{ quantity: 1, unitPrice: 25.0 }],
        },
      ];

      jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);
      jest.spyOn(prisma.command, 'findMany').mockResolvedValue(mockCommands);

      const result = await service.getStatistics(1);

      expect(result).toEqual({
        clientId: 1,
        totalCommands: 4,
        statusCount: {
          WAITING: 1,
          PENDING: 1,
          DELIVERED: 1,
          CANCELLED: 1,
        },
        totalItems: 15,
        totalValue: expect.any(Number),
        averageOrderValue: expect.any(Number),
      });
    });
  });
});
