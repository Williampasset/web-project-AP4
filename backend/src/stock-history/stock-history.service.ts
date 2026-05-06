import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StockHistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const histories = await this.prisma.stockHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Récupérer les données enrichies pour chaque entrée
    const enriched = await Promise.all(
      histories.map(async (history) => {
        let fromLocationName: string | null = null;
        let toLocationName: string | null = null;
        let supplierName: string | null = null;
        let commandRef: string | null = null;
        let jobId: number | null = null;

        if (history.fromLocationId) {
          const location = await this.prisma.location.findUnique({
            where: { id: history.fromLocationId },
          });
          if (location) {
            fromLocationName = `${location.building}-${location.aisle}-${location.shelf}-${location.cell}`;
          }
        }

        if (history.toLocationId) {
          const location = await this.prisma.location.findUnique({
            where: { id: history.toLocationId },
          });
          if (location) {
            toLocationName = `${location.building}-${location.aisle}-${location.shelf}-${location.cell}`;
          }
        }

        if (history.supplierId) {
          const supplier = await this.prisma.supplier.findUnique({
            where: { id: history.supplierId },
          });
          if (supplier) {
            supplierName = supplier.name;
          }
        }

        if (history.commandId) {
          const command = await this.prisma.command.findUnique({
            where: { id: history.commandId },
          });
          if (command) {
            commandRef = command.reference;
          }
        }

        if (history.stockJobId) {
          jobId = history.stockJobId;
        }

        return {
          ...history,
          fromLocationName,
          toLocationName,
          supplierName,
          commandRef,
          jobId,
        };
      }),
    );

    return enriched;
  }
}
