import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let prisma: PrismaService;

  const mockSupplier = {
    id: 1,
    name: 'Tech Supplies Inc',
    email: 'contact@techsupplies.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix, 75000 Paris',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createSupplierDto: CreateSupplierDto = {
    name: 'Tech Supplies Inc',
    email: 'contact@techsupplies.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix, 75000 Paris',
  };

  const updateSupplierDto: UpdateSupplierDto = {
    name: 'Updated Supplier Name',
    phone: '+33987654321',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      supplier: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      article: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a supplier', async () => {
      jest.spyOn(prisma.supplier, 'create').mockResolvedValue(mockSupplier);

      const result = await service.create(createSupplierDto);

      expect(result).toEqual(mockSupplier);
      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: createSupplierDto,
      });
    });

    it('should create supplier with minimal required fields', async () => {
      const minimalDto: CreateSupplierDto = {
        name: 'Simple Supplier',
        address: '456 Avenue Main',
      };

      jest.spyOn(prisma.supplier, 'create').mockResolvedValue({
        ...mockSupplier,
        ...minimalDto,
        email: null,
        phone: null,
      });

      const result = await service.create(minimalDto);

      expect(result).toEqual(expect.objectContaining(minimalDto));
      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: minimalDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all suppliers', async () => {
      const mockSuppliers = [
        mockSupplier,
        { ...mockSupplier, id: 2, name: 'Another Supplier' },
      ];

      jest.spyOn(prisma.supplier, 'findMany').mockResolvedValue(mockSuppliers);

      const result = await service.findAll();

      expect(result).toEqual(mockSuppliers);
      expect(prisma.supplier.findMany).toHaveBeenCalled();
    });

    it('should return empty list if no suppliers exist', async () => {
      jest.spyOn(prisma.supplier, 'findMany').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(mockSupplier);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSupplier);
      expect(prisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    it('should return a supplier by name', async () => {
      jest.spyOn(prisma.supplier, 'findFirst').mockResolvedValue(mockSupplier);

      const result = await service.findByName('Tech Supplies');

      expect(result).toEqual(mockSupplier);
      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'tech supplies',
          },
        },
      });
    });

    it('should throw NotFoundException if supplier name not found', async () => {
      jest.spyOn(prisma.supplier, 'findFirst').mockResolvedValue(null);

      await expect(service.findByName('Nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should perform case-insensitive search', async () => {
      jest.spyOn(prisma.supplier, 'findFirst').mockResolvedValue(mockSupplier);

      await service.findByName('tech supplies');

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'tech supplies',
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should successfully update a supplier', async () => {
      const updatedSupplier = { ...mockSupplier, ...updateSupplierDto };

      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(mockSupplier);
      jest.spyOn(prisma.supplier, 'update').mockResolvedValue(updatedSupplier);

      const result = await service.update(1, updateSupplierDto);

      expect(result).toEqual(updatedSupplier);
      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateSupplierDto,
      });
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(null);

      await expect(service.update(999, updateSupplierDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.supplier.update).not.toHaveBeenCalled();
    });

    it('should allow partial updates', async () => {
      const partialUpdate: UpdateSupplierDto = { email: 'newemail@test.com' };
      const updatedSupplier = { ...mockSupplier, ...partialUpdate };

      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(mockSupplier);
      jest.spyOn(prisma.supplier, 'update').mockResolvedValue(updatedSupplier);

      const result = await service.update(1, partialUpdate);

      expect(result).toEqual(updatedSupplier);
      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: partialUpdate,
      });
    });
  });

  describe('remove', () => {
    it('should successfully delete a supplier', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(mockSupplier);
      jest.spyOn(prisma.supplier, 'delete').mockResolvedValue(mockSupplier);

      const result = await service.remove(1);

      expect(result).toEqual(mockSupplier);
      expect(prisma.supplier.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(prisma.supplier.delete).not.toHaveBeenCalled();
    });
  });

  describe('countArticles', () => {
    it('should return count of articles for a supplier', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(mockSupplier);
      jest.spyOn(prisma.article, 'count').mockResolvedValue(5);

      const result = await service.countArticles(1);

      expect(result).toBe(5);
      expect(prisma.article.count).toHaveBeenCalledWith({
        where: { supplierId: 1 },
      });
    });

    it('should return 0 if supplier has no articles', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(mockSupplier);
      jest.spyOn(prisma.article, 'count').mockResolvedValue(0);

      const result = await service.countArticles(1);

      expect(result).toBe(0);
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(null);

      await expect(service.countArticles(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.article.count).not.toHaveBeenCalled();
    });
  });
});
