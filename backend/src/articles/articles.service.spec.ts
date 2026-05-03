import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { BuildingName } from '@prisma/client';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let prisma: PrismaService;

  const mockArticle = {
    id: 1,
    reference: 'ART-001',
    label: 'Test Article',
    weight: 220.5,
    price: 10.99,
    stock: 10,
    locationId: 1,
    supplierId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLocation = {
    id: 1,
    building: 'BUILDING_A' as BuildingName,
    aisle: 1,
    shelf: 2,
    cell: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSupplier = {
    id: 1,
    name: 'Supplier 1',
    email: 'supplier@example.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix, 75000 Paris',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createArticleDto: CreateArticleDto = {
    reference: 'ART-001',
    label: 'Test Article',
    weight: 220.5,
    price: 10.99,
    stock: 10,
    locationId: 1,
    supplierId: 1,
  };

  const updateArticleDto: UpdateArticleDto = {
    label: 'Updated Article',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      article: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      location: {
        findUnique: jest.fn(),
      },
      supplier: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create an article', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.location, 'findUnique').mockResolvedValue(mockLocation);
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(mockSupplier);
      jest.spyOn(prisma.article, 'create').mockResolvedValue(mockArticle);

      const result = await service.create(createArticleDto);

      expect(result).toEqual(mockArticle);
      expect(prisma.article.create).toHaveBeenCalledWith({
        data: createArticleDto,
      });
    });

    it('should throw ConflictException if reference already exists', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(mockArticle);

      await expect(service.create(createArticleDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.article.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if location does not exist', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.location, 'findUnique').mockResolvedValue(null);

      await expect(service.create(createArticleDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.article.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.location, 'findUnique').mockResolvedValue(mockLocation);
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(null);

      await expect(service.create(createArticleDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.article.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      const mockArticles = [
        mockArticle,
        { ...mockArticle, id: 2, reference: 'ART-002' },
      ];

      jest.spyOn(prisma.article, 'findMany').mockResolvedValue(mockArticles);

      const result = await service.findAll();

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalled();
    });

    it('should return empty list if no articles exist', async () => {
      jest.spyOn(prisma.article, 'findMany').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an article by its id', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(mockArticle);

      const result = await service.findOne(1);

      expect(result).toEqual(mockArticle);
      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if article does not exist', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByReference', () => {
    it('should return an article by its reference', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(mockArticle);

      const result = await service.findByReference('ART-001');

      expect(result).toEqual(mockArticle);
      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { reference: 'ART-001' },
      });
    });

    it('should throw NotFoundException if no article matches the reference', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(null);

      await expect(service.findByReference('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update an article', async () => {
      const updatedArticle = { ...mockArticle, ...updateArticleDto };

      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(mockArticle);
      jest.spyOn(prisma.article, 'update').mockResolvedValue(updatedArticle);

      const result = await service.update(1, updateArticleDto);

      expect(result).toEqual(updatedArticle);
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateArticleDto,
      });
    });

    it('should throw NotFoundException if article does not exist', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(null);

      await expect(service.update(999, updateArticleDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.article.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if new reference already exists', async () => {
      const updateWithNewReference: UpdateArticleDto = {
        reference: 'ART-002',
      };
      const existingArticle = { ...mockArticle, reference: 'ART-002' };

      jest
        .spyOn(prisma.article, 'findUnique')
        .mockResolvedValueOnce(mockArticle)
        .mockResolvedValueOnce(existingArticle);

      await expect(service.update(1, updateWithNewReference)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.article.update).not.toHaveBeenCalled();
    });

    it('should allow update if reference remains the same', async () => {
      const updateWithSameReference: UpdateArticleDto = {
        reference: 'ART-001',
        label: 'Updated Article',
      };
      const updatedArticle = { ...mockArticle, ...updateWithSameReference };

      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(mockArticle);
      jest.spyOn(prisma.article, 'update').mockResolvedValue(updatedArticle);

      const result = await service.update(1, updateWithSameReference);

      expect(result).toEqual(updatedArticle);
      expect(prisma.article.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully delete an article', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(mockArticle);
      jest.spyOn(prisma.article, 'delete').mockResolvedValue(mockArticle);

      const result = await service.remove(1);

      expect(result).toEqual(mockArticle);
      expect(prisma.article.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if article does not exist', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(prisma.article.delete).not.toHaveBeenCalled();
    });
  });

  describe('doesReferenceExist', () => {
    it('should return true if reference exists', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(mockArticle);

      const result = await service.doesReferenceExist('ART-001');

      expect(result).toBe(true);
    });

    it('should return false if reference does not exist', async () => {
      jest.spyOn(prisma.article, 'findUnique').mockResolvedValue(null);

      const result = await service.doesReferenceExist('INVALID');

      expect(result).toBe(false);
    });
  });

  describe('ensureLocationExists', () => {
    it('should verify that location exists', async () => {
      jest.spyOn(prisma.location, 'findUnique').mockResolvedValue(mockLocation);

      await expect(service.ensureLocationExists(1)).resolves.not.toThrow();
    });

    it('should throw NotFoundException if location does not exist', async () => {
      jest.spyOn(prisma.location, 'findUnique').mockResolvedValue(null);

      await expect(service.ensureLocationExists(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('ensureSupplierExists', () => {
    it('should verify that supplier exists', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(mockSupplier);

      await expect(service.ensureSupplierExists(1)).resolves.not.toThrow();
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(null);

      await expect(service.ensureSupplierExists(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
