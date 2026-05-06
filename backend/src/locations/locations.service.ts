import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.location.findMany({
      include: {
        articles: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: [
        { building: 'asc' },
        { aisle: 'asc' },
        { shelf: 'asc' },
        { cell: 'asc' },
      ],
    });
  }
}
