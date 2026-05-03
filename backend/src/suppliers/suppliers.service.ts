import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new supplier in database
   * @param createSupplierDto Validated data for supplier creation
   * @returns Created supplier
   */
  async create(createSupplierDto: CreateSupplierDto) {
    const result = await this.prisma.supplier.create({
      data: createSupplierDto,
    });

    return result;
  }

  /**
   * Retrieve all suppliers in database
   * @returns All suppliers in database
   */
  async findAll() {
    const result = await this.prisma.supplier.findMany();
    return result;
  }

  /**
   * Find a supplier by id
   * @param id Supplier's id we want to fetch
   * @returns Supplier data matching the id
   */
  async findOne(id: number) {
    const supplier = await this.findSupplierOrThrow(id);
    return supplier;
  }

  /**
   * Find a supplier by name
   * @param name The name to search for
   * @returns The supplier matching the name
   */
  async findByName(name: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });

    if (!supplier) throw new NotFoundException(`Supplier "${name}" not found`);

    return supplier;
  }

  /**
   * Update an existing supplier by id
   * @param id Identifier of the supplier to update
   * @param updateSupplierDto Validated data for updating the supplier
   * @returns The updated supplier
   */
  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    await this.findSupplierOrThrow(id);

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  /**
   * Delete a supplier by id
   * @param id Identifier of the supplier to remove
   * @returns The deleted supplier
   */
  async remove(id: number) {
    await this.findSupplierOrThrow(id);

    return this.prisma.supplier.delete({ where: { id } });
  }

  /**
   * Find supplier or throw an Exception
   * @param id Id of the supplier we are looking for
   * @returns Supplier data
   */
  private async findSupplierOrThrow(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) throw new NotFoundException(`Supplier #${id} not found`);

    return supplier;
  }

  /**
   * Get articles count for a supplier
   * @param id Supplier id
   * @returns Count of articles supplied by this supplier
   */
  async countArticles(id: number) {
    await this.findSupplierOrThrow(id);

    const count = await this.prisma.article.count({
      where: { supplierId: id },
    });

    return count;
  }
}
