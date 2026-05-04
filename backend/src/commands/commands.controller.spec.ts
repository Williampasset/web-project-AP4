import { Test, TestingModule } from '@nestjs/testing';
import { CommandsController } from './commands.controller';
import { CommandsService } from './commands.service';
import { CreateCommandDto } from './dto/create-command.dto';
import { UpdateCommandDto } from './dto/update-command.dto';
import { CommandStatus } from './enums/command-status.enum';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

describe('CommandsController', () => {
  let controller: CommandsController;
  let service: CommandsService;

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
  } as any;

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
    const mockCommandsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByReference: jest.fn(),
      findByStatus: jest.fn(),
      findByUser: jest.fn(),
      findByClient: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommandsController],
      providers: [
        {
          provide: CommandsService,
          useValue: mockCommandsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<CommandsController>(CommandsController);
    service = module.get<CommandsService>(CommandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a command and return it', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockCommand);

      const result = await controller.create(createCommandDto);

      expect(result).toEqual(mockCommand);
      expect(service.create).toHaveBeenCalledWith(createCommandDto);
    });

    it('should pass correct parameters to service', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockCommand);

      await controller.create(createCommandDto);

      expect(service.create).toHaveBeenCalledWith({
        reference: 'CMD-001',
        clientId: 1,
        userId: 1,
        truckId: 1,
        items: expect.any(Array),
      });
    });
  });

  describe('findAll', () => {
    it('should return all commands', async () => {
      const mockCommands = [mockCommand];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockCommands);

      const result = await controller.findAll();

      expect(result).toEqual(mockCommands);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should filter commands by status', async () => {
      const mockCommands = [{ ...mockCommand, status: CommandStatus.PENDING }];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockCommands);

      const result = await controller.findAll(CommandStatus.PENDING);

      expect(result).toEqual(mockCommands);
      expect(service.findAll).toHaveBeenCalledWith(
        CommandStatus.PENDING,
        undefined,
      );
    });

    it('should filter commands by userId', async () => {
      const mockCommands = [mockCommand];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockCommands);

      const result = await controller.findAll(undefined, 1);

      expect(result).toEqual(mockCommands);
      expect(service.findAll).toHaveBeenCalledWith(undefined, 1);
    });

    it('should filter by both status and userId', async () => {
      const mockCommands = [mockCommand];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockCommands);

      const result = await controller.findAll(CommandStatus.WAITING, 1);

      expect(result).toEqual(mockCommands);
      expect(service.findAll).toHaveBeenCalledWith(CommandStatus.WAITING, 1);
    });
  });

  describe('findOne', () => {
    it('should return a command by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockCommand);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockCommand);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw error when command is not found', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new Error('Command not found'));

      await expect(controller.findOne(999)).rejects.toThrow(
        'Command not found',
      );
    });
  });

  describe('findByReference', () => {
    it('should return a command by reference', async () => {
      jest.spyOn(service, 'findByReference').mockResolvedValue(mockCommand);

      const result = await controller.findByReference('CMD-001');

      expect(result).toEqual(mockCommand);
      expect(service.findByReference).toHaveBeenCalledWith('CMD-001');
    });

    it('should throw error when reference is not found', async () => {
      jest
        .spyOn(service, 'findByReference')
        .mockRejectedValue(new Error('Command not found'));

      await expect(controller.findByReference('INVALID')).rejects.toThrow(
        'Command not found',
      );
    });
  });

  describe('findByStatus', () => {
    it('should return commands filtered by status', async () => {
      const mockCommands = [{ ...mockCommand, status: CommandStatus.PENDING }];
      jest.spyOn(service, 'findByStatus').mockResolvedValue(mockCommands);

      const result = await controller.findByStatus(CommandStatus.PENDING);

      expect(result).toEqual(mockCommands);
      expect(service.findByStatus).toHaveBeenCalledWith(CommandStatus.PENDING);
    });
  });

  describe('findByUser', () => {
    it('should return commands assigned to user', async () => {
      const mockCommands = [mockCommand];
      jest.spyOn(service, 'findByUser').mockResolvedValue(mockCommands);

      const result = await controller.findByUser(1);

      expect(result).toEqual(mockCommands);
      expect(service.findByUser).toHaveBeenCalledWith(1);
    });

    it('should throw error when user is not found', async () => {
      jest
        .spyOn(service, 'findByUser')
        .mockRejectedValue(new Error('User not found'));

      await expect(controller.findByUser(999)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('findByClient', () => {
    it('should return commands for a client', async () => {
      const mockCommands = [mockCommand];
      jest.spyOn(service, 'findByClient').mockResolvedValue(mockCommands);

      const result = await controller.findByClient(1);

      expect(result).toEqual(mockCommands);
      expect(service.findByClient).toHaveBeenCalledWith(1);
    });

    it('should throw error when client is not found', async () => {
      jest
        .spyOn(service, 'findByClient')
        .mockRejectedValue(new Error('Client not found'));

      await expect(controller.findByClient(999)).rejects.toThrow(
        'Client not found',
      );
    });
  });

  describe('update', () => {
    it('should update a command', async () => {
      const updatedCommand = { ...mockCommand, status: CommandStatus.PENDING };
      jest.spyOn(service, 'update').mockResolvedValue(updatedCommand);

      const result = await controller.update(1, updateCommandDto);

      expect(result).toEqual(updatedCommand);
      expect(service.update).toHaveBeenCalledWith(1, updateCommandDto);
    });

    it('should throw error when command is not found', async () => {
      jest
        .spyOn(service, 'update')
        .mockRejectedValue(new Error('Command not found'));

      await expect(controller.update(999, updateCommandDto)).rejects.toThrow(
        'Command not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update command status', async () => {
      const updatedCommand = {
        ...mockCommand,
        status: CommandStatus.DELIVERED,
      };
      jest.spyOn(service, 'updateStatus').mockResolvedValue(updatedCommand);

      const result = await controller.updateStatus(1, CommandStatus.DELIVERED);

      expect(result).toEqual(updatedCommand);
      expect(service.updateStatus).toHaveBeenCalledWith(
        1,
        CommandStatus.DELIVERED,
      );
    });

    it('should throw error when command is not found', async () => {
      jest
        .spyOn(service, 'updateStatus')
        .mockRejectedValue(new Error('Command not found'));

      await expect(
        controller.updateStatus(999, CommandStatus.PENDING),
      ).rejects.toThrow('Command not found');
    });
  });

  describe('remove', () => {
    it('should delete a command', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockCommand);

      const result = await controller.remove(1);

      expect(result).toEqual(mockCommand);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw error when command is not found', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValue(new Error('Command not found'));

      await expect(controller.remove(999)).rejects.toThrow('Command not found');
    });
  });
});
