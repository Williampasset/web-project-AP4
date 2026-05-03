import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new article in database
   * @param createArticleDto Validated data for article creation
   * @returns Article create
   */
  async create(createArticleDto: CreateArticleDto) {
    const { reference, locationId, supplierId } = createArticleDto;

    if (await this.doesReferenceExist(reference)) {
      throw new ConflictException(
        'The reference is already used by another article',
      );
    }

    await this.ensureLocationExists(locationId);
    await this.ensureSupplierExists(supplierId);

    const result = await this.prisma.article.create({
      data: createArticleDto,
    });

    return result;
  }

  /**
   * Retrieve all articles in database
   * @returns All articles in database
   */
  async findAll() {
    const result = await this.prisma.article.findMany();
    return result;
  }

  /**
   * Find an article by id
   * @param id Article's id we want to fetch
   * @returns Article data matching the id
   */
  async findOne(id: number) {
    const article = await this.findArticleOrThrow(id);

    return article;
  }

  /**
   * Find an article by reference
   * @param matricule The reference to search for.
   * @returns The user matching the reference.
   */
  async findByReference(reference: string) {
    const article = await this.prisma.article.findUnique({
      where: {
        reference: reference,
      },
    });

    if (!article)
      throw new NotFoundException(`Article #${reference} not found`);

    return article;
  }

  /**
   * Update an existing article by id.
   * @param id Identifier of the article to update.
   * @param updateArticleDto Validated data for updating the article.
   * @returns The updated article.
   */
  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const article = await this.findArticleOrThrow(id);

    if (
      updateArticleDto.reference &&
      updateArticleDto.reference !== article.reference
    ) {
      const existing = await this.doesReferenceExist(
        updateArticleDto.reference,
      );

      if (existing) {
        throw new ConflictException(
          'The reference is already used by another article',
        );
      }
    }

    return this.prisma.article.update({
      where: { id: id },
      data: updateArticleDto,
    });
  }

  /**
   * Delete a article by id.
   * @param id Identifier of the article to remove.
   * @returns The deleted article.
   */
  async remove(id: number) {
    await this.findArticleOrThrow(id);

    return this.prisma.article.delete({ where: { id } });
  }

  /**
   * Check whether a reference is already used by an existing article.
   * @param reference The reference to check.
   * @returns True if the reference is already taken, otherwise false.
   */
  async doesReferenceExist(reference: string): Promise<boolean> {
    const article = await this.prisma.article.findUnique({
      where: { reference },
    });

    return !!article;
  }

  /**
   * Find article or throw an Exception
   * @param id Id of the article we are looking for
   * @returns Article existence
   */
  private async findArticleOrThrow(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) throw new NotFoundException(`Article #${id} not found`);

    return article;
  }

  /**
   * Ensure that a supplier exists in database.
   * Throws a NotFoundException if not found.
   *
   * @param supplierId - The ID of the supplier to verify
   */
  async ensureSupplierExists(supplierId: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier #${supplierId} not found`);
    }
  }

  /**
   * Ensure that a location exists in database.
   * Throws a NotFoundException if not found.
   *
   * @param locationId - The ID of the location to verify
   */
  async ensureLocationExists(locationId: number) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException(`Location #${locationId} not found`);
    }
  }
}
