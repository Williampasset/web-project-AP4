import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let service: ArticlesService;

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
    const mockArticlesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByReference: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<ArticlesController>(ArticlesController);
    service = module.get<ArticlesService>(ArticlesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an article and return it', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockArticle);

      const result = await controller.create(createArticleDto);

      expect(result).toEqual(mockArticle);
      expect(service.create).toHaveBeenCalledWith(createArticleDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should call service.create with correct parameters', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockArticle);

      await controller.create(createArticleDto);

      expect(service.create).toHaveBeenCalledWith({
        reference: 'ART-001',
        label: 'Test Article',
        weight: 220.5,
        price: 10.99,
        stock: 10,
        locationId: 1,
        supplierId: 1,
      });
    });
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      const mockArticles = [
        mockArticle,
        { ...mockArticle, id: 2, reference: 'ART-002' },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(mockArticles);

      const result = await controller.findAll();

      expect(result).toEqual(mockArticles);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty list when no articles exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return an article by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockArticle);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockArticle);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should pass correct id to service', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockArticle);

      await controller.findOne(123);

      expect(service.findOne).toHaveBeenCalledWith(123);
    });

    it('should throw error when article is not found', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new Error('Article not found'));

      await expect(controller.findOne(999)).rejects.toThrow(
        'Article not found',
      );
    });
  });

  describe('findByReference', () => {
    it('should return an article by reference', async () => {
      jest.spyOn(service, 'findByReference').mockResolvedValue(mockArticle);

      const result = await controller.findByReference('ART-001');

      expect(result).toEqual(mockArticle);
      expect(service.findByReference).toHaveBeenCalledWith('ART-001');
    });

    it('should pass correct reference to service', async () => {
      jest.spyOn(service, 'findByReference').mockResolvedValue(mockArticle);

      await controller.findByReference('ART-ABC-123');

      expect(service.findByReference).toHaveBeenCalledWith('ART-ABC-123');
    });

    it('should throw error when article reference is not found', async () => {
      jest
        .spyOn(service, 'findByReference')
        .mockRejectedValue(new Error('Article not found'));

      await expect(controller.findByReference('INVALID')).rejects.toThrow(
        'Article not found',
      );
    });
  });

  describe('update', () => {
    it('should update an article and return it', async () => {
      const updatedArticle = { ...mockArticle, ...updateArticleDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedArticle);

      const result = await controller.update(1, updateArticleDto);

      expect(result).toEqual(updatedArticle);
      expect(service.update).toHaveBeenCalledWith(1, updateArticleDto);
    });

    it('should pass correct parameters to service', async () => {
      const updatedArticle = { ...mockArticle, ...updateArticleDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedArticle);

      await controller.update(5, updateArticleDto);

      expect(service.update).toHaveBeenCalledWith(5, updateArticleDto);
    });

    it('should throw error when article is not found', async () => {
      jest
        .spyOn(service, 'update')
        .mockRejectedValue(new Error('Article not found'));

      await expect(controller.update(999, updateArticleDto)).rejects.toThrow(
        'Article not found',
      );
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateArticleDto = { stock: 50 };
      const updatedArticle = { ...mockArticle, stock: 50 };
      jest.spyOn(service, 'update').mockResolvedValue(updatedArticle);

      const result = await controller.update(1, partialUpdate);

      expect(result).toEqual(updatedArticle);
      expect(service.update).toHaveBeenCalledWith(1, partialUpdate);
    });
  });

  describe('remove', () => {
    it('should delete an article and return it', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockArticle);

      const result = await controller.remove(1);

      expect(result).toEqual(mockArticle);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should pass correct id to service', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockArticle);

      await controller.remove(42);

      expect(service.remove).toHaveBeenCalledWith(42);
    });

    it('should throw error when article is not found', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValue(new Error('Article not found'));

      await expect(controller.remove(999)).rejects.toThrow('Article not found');
    });
  });

  describe('JwtAuthGuard', () => {
    it('should be applied to all routes', async () => {
      const metadata = Reflect.getMetadata('__guards__', ArticlesController);
      expect(metadata).toBeDefined();
    });
  });
});
