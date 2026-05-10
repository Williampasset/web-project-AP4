import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;

  const mockSupplier = {
    id: 1,
    name: 'Tech Supplies Inc',
    email: 'contact@techsupplies.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix, 75000 Paris',
    createdAt: new Date(),
    updatedAt: new Date(),
    articles: [],
  };

  const createSupplierDto: CreateSupplierDto = {
    name: 'Tech Supplies Inc',
    email: 'contact@techsupplies.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix, 75000 Paris',
  };

  const updateSupplierDto: UpdateSupplierDto = {
    name: 'Updated Supplier',
  };

  beforeEach(async () => {
    const mockSuppliersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByName: jest.fn(),
      countArticles: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a supplier and return it', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockSupplier);

      const result = await controller.create(createSupplierDto);

      expect(result).toEqual(mockSupplier);
      expect(service.create).toHaveBeenCalledWith(createSupplierDto);
    });

    it('should pass correct parameters to service', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockSupplier);

      await controller.create(createSupplierDto);

      expect(service.create).toHaveBeenCalledWith({
        name: 'Tech Supplies Inc',
        email: 'contact@techsupplies.com',
        phone: '+33123456789',
        address: '123 Rue de la Paix, 75000 Paris',
      });
    });
  });

  describe('findAll', () => {
    it('should return all suppliers', async () => {
      const mockSuppliers = [
        mockSupplier,
        { ...mockSupplier, id: 2, name: 'Another Supplier' },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(mockSuppliers);

      const result = await controller.findAll();

      expect(result).toEqual(mockSuppliers);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty list when no suppliers exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSupplier);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockSupplier);
    });

    it('should throw error when supplier is not found', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new Error('Supplier not found'));

      await expect(controller.findOne(999)).rejects.toThrow(
        'Supplier not found',
      );
    });
  });

  describe('findByName', () => {
    it('should return a supplier by name', async () => {
      jest.spyOn(service, 'findByName').mockResolvedValue(mockSupplier);

      const result = await controller.findByName('Tech Supplies');

      expect(result).toEqual(mockSupplier);
      expect(service.findByName).toHaveBeenCalledWith('Tech Supplies');
    });

    it('should throw error when supplier name not found', async () => {
      jest
        .spyOn(service, 'findByName')
        .mockRejectedValue(new Error('Supplier not found'));

      await expect(controller.findByName('Nonexistent')).rejects.toThrow(
        'Supplier not found',
      );
    });
  });

  describe('countArticles', () => {
    it('should return articles count for a supplier', async () => {
      jest.spyOn(service, 'countArticles').mockResolvedValue(5);

      const result = await controller.countArticles(1);

      expect(result).toEqual({ supplierId: 1, articlesCount: 5 });
      expect(service.countArticles).toHaveBeenCalledWith(1);
    });

    it('should return 0 if supplier has no articles', async () => {
      jest.spyOn(service, 'countArticles').mockResolvedValue(0);

      const result = await controller.countArticles(1);

      expect(result).toEqual({ supplierId: 1, articlesCount: 0 });
    });

    it('should throw error when supplier is not found', async () => {
      jest
        .spyOn(service, 'countArticles')
        .mockRejectedValue(new Error('Supplier not found'));

      await expect(controller.countArticles(999)).rejects.toThrow(
        'Supplier not found',
      );
    });
  });

  describe('update', () => {
    it('should update a supplier and return it', async () => {
      const updatedSupplier = { ...mockSupplier, ...updateSupplierDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedSupplier);

      const result = await controller.update(1, updateSupplierDto);

      expect(result).toEqual(updatedSupplier);
      expect(service.update).toHaveBeenCalledWith(1, updateSupplierDto);
    });

    it('should throw error when supplier is not found', async () => {
      jest
        .spyOn(service, 'update')
        .mockRejectedValue(new Error('Supplier not found'));

      await expect(controller.update(999, updateSupplierDto)).rejects.toThrow(
        'Supplier not found',
      );
    });
  });

  describe('remove', () => {
    it('should delete a supplier and return it', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockSupplier);

      const result = await controller.remove(1);

      expect(result).toEqual(mockSupplier);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw error when supplier is not found', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValue(new Error('Supplier not found'));

      await expect(controller.remove(999)).rejects.toThrow(
        'Supplier not found',
      );
    });
  });
});
