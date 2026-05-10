import type { Command } from '@type/command.type';
import type { WarehouseLocation } from '@type/warehouse-location.type';

export interface FilterOptions {
  status: string;
  searchTerm: string;
  sortBy: 'date' | 'status' | 'reference';
  sortOrder: 'asc' | 'desc';
}

export type AssignedStockTask = {
  id: number;
  type: 'MOVE' | 'MERGE';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  quantity: number;
  requestedAt: string;
  sourceLocationCode: string;
  sourceArticleReference: string;
  sourceArticleLabel: string;
};

export const DEFAULT_FILTERS: FilterOptions = {
  status: 'ALL',
  searchTerm: '',
  sortBy: 'date',
  sortOrder: 'desc',
};

export function getOperatorUserId(): number | null {
  const user = localStorage.getItem('user');
  return user ? Number(JSON.parse(user)?.sub) : null;
}

export function getFilteredAndSortedCommands(
  commands: Command[],
  filters: FilterOptions,
): Command[] {
  const filtered = commands.filter((command) => {
    if (command.status !== 'WAITING' && command.status !== 'PENDING') {
      return false;
    }

    if (filters.status !== 'ALL' && command.status !== filters.status) {
      return false;
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return command.reference.toLowerCase().includes(searchLower) ?? false;
    }

    return true;
  });

  filtered.sort((a, b) => {
    let compareValue = 0;

    switch (filters.sortBy) {
      case 'date':
        compareValue =
          new Date(a.commandDate).getTime() - new Date(b.commandDate).getTime();
        break;
      case 'status':
        compareValue = a.status.localeCompare(b.status);
        break;
      case 'reference':
        compareValue = a.reference.localeCompare(b.reference);
        break;
    }

    return filters.sortOrder === 'asc' ? compareValue : -compareValue;
  });

  return filtered;
}

export function getAssignedStockTasks(
  locations: WarehouseLocation[],
  userId: number | null,
): AssignedStockTask[] {
  if (userId == null) return [];

  return locations
    .flatMap((location) => {
      const sourceLocationCode = `${location.building}${location.aisle}S${location.shelf}C${location.cell}`;

      return (location.pendingJobs ?? [])
        .filter((job) => job.assignedUser.id === userId)
        .map((job) => {
          const sourceArticle =
            location.articles.find((article) => article.id === job.sourceArticleId) ??
            null;

          return {
            id: job.id,
            type: job.type,
            status: job.status,
            quantity: job.quantity,
            requestedAt: job.requestedAt,
            sourceLocationCode,
            sourceArticleReference:
              sourceArticle?.reference ?? `Article #${job.sourceArticleId}`,
            sourceArticleLabel: sourceArticle?.label ?? 'Article',
          };
        });
    })
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
}

export function getCommandStatistics(commands: Command[]) {
  return {
    total: commands.filter((c) => c.status === 'WAITING' || c.status === 'PENDING')
      .length,
    waiting: commands.filter((c) => c.status === 'WAITING').length,
    pending: commands.filter((c) => c.status === 'PENDING').length,
  };
}
