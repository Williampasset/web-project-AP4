import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CommandStatus } from '@prisma/client';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  const mockClient = {
    id: 1,
    name: 'Acme',
    address: 'Paris',
    email: 'acme@test.com',
    phone: '123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockClientWithCommands = {
    ...mockClient,
    commands: [
      {
        id: 1,
        reference: 'CMD-001',
        status: CommandStatus.WAITING,
        commandDate: new Date(),
      },
    ],
  };

  const createDto: CreateClientDto = {
    name: 'Acme',
    address: 'Paris',
    email: 'acme@test.com',
    phone: '123456789',
  };

  const updateDto: UpdateClientDto = {
    name: 'Updated Acme',
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByName: jest.fn(),
      countCommands: jest.fn(),
      getTotalSpent: jest.fn(),
      getStatistics: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a client', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockClient);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockClient);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all clients', async () => {
      const clients = [mockClient];
      jest.spyOn(service, 'findAll').mockResolvedValue(clients);

      const result = await controller.findAll();

      expect(result).toEqual(clients);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a client', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockClient);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockClient);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw if not found', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new Error('Client not found'));

      await expect(controller.findOne(999)).rejects.toThrow('Client not found');
    });
  });

  describe('findByName', () => {
    it('should return clients by name', async () => {
      const clients = mockClientWithCommands;
      jest.spyOn(service, 'findByName').mockResolvedValue(clients);

      const result = await controller.findByName('Acme');

      expect(result).toEqual(clients);
      expect(service.findByName).toHaveBeenCalledWith('Acme');
    });

    it('should throw if no client found', async () => {
      jest
        .spyOn(service, 'findByName')
        .mockRejectedValue(new Error('Client not found'));

      await expect(controller.findByName('XXX')).rejects.toThrow(
        'Client not found',
      );
    });
  });

  describe('countCommands', () => {
    it('should return commands count', async () => {
      jest.spyOn(service, 'countCommands').mockResolvedValue(5);

      const result = await controller.countCommands(1);

      expect(result).toEqual({ clientId: 1, commandsCount: 5 });
      expect(service.countCommands).toHaveBeenCalledWith(1);
    });
  });

  describe('getTotalSpent', () => {
    it('should return total spent', async () => {
      const mock = {
        clientId: 1,
        totalSpent: 100,
        deliveredCommandsCount: 2,
      };

      jest.spyOn(service, 'getTotalSpent').mockResolvedValue(mock);

      const result = await controller.getTotalSpent(1);

      expect(result).toEqual(mock);
      expect(service.getTotalSpent).toHaveBeenCalledWith(1);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      const stats = {
        clientId: 1,
        totalCommands: 10,
        statusCount: {
          WAITING: 0,
          PENDING: 0,
          DELIVERED: 0,
          CANCELLED: 0,
        },
        totalItems: 10,
        totalValue: 100,
        averageOrderValue: 10,
      };

      jest.spyOn(service, 'getStatistics').mockResolvedValue(stats);

      const result = await controller.getStatistics(1);

      expect(result).toEqual(stats);
      expect(service.getStatistics).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update client', async () => {
      const updated = { ...mockClient, ...updateDto };

      jest.spyOn(service, 'update').mockResolvedValue(updated);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw if client not found', async () => {
      jest
        .spyOn(service, 'update')
        .mockRejectedValue(new Error('Client not found'));

      await expect(controller.update(999, updateDto)).rejects.toThrow(
        'Client not found',
      );
    });
  });

  describe('remove', () => {
    it('should delete client', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockClient);

      const result = await controller.remove(1);

      expect(result).toEqual(mockClient);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw if client not found', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValue(new Error('Client not found'));

      await expect(controller.remove(999)).rejects.toThrow('Client not found');
    });
  });
});
