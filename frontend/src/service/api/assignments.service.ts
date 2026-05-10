import { getHeaders } from './api.helper';
import type { WarehouseLocation } from '@type/warehouse-location.type';

const BASE_URL = '/api';

const parseErrorMessage = async (res: Response, fallback: string) => {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') return body.message;
    if (Array.isArray(body?.message)) return body.message.join(', ');
    if (body?.error) return String(body.error);
  } catch {
    try {
      const text = await res.text();
      if (text) return text;
    } catch {
      // ignore
    }
  }
  return fallback;
};

// Types for assignments
export interface CommandAssignmentData {
  id: number;
  reference: string;
  status: 'WAITING' | 'PENDING' | 'DELIVERED' | 'CANCELLED';
  clientName: string;
  commandDate: string;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    matricule: string;
  };
  itemsCount: number;
}

export interface StockJobAssignmentData {
  id: number;
  type: 'MOVE' | 'MERGE';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  quantity: number;
  sourceArticle: {
    id: number;
    reference: string;
    label: string;
  };
  targetLocation?: {
    id: number;
    building: string;
    aisle: number;
    shelf: number;
    cell: number;
  };
  assignedUserId: number;
  assignedUser: {
    id: number;
    firstName: string;
    lastName: string;
    matricule: string;
  };
  requestedAt: string;
}

export interface LoadingStageData {
  id: number;
  commandReference: string;
  stage: 'PREPARATION' | 'LOADING_ZONE' | 'LOADING_TRUCK' | 'LOADED';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  clientName: string;
}

// Fetch commands for assignment
export const fetchCommandsForAssignment = async (): Promise<
  CommandAssignmentData[]
> => {
  try {
    // Fetch WAITING commands
    const waitingRes = await fetch(`${BASE_URL}/commands?status=WAITING`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    let waiting: any[] = [];
    if (waitingRes.ok) {
      waiting = await waitingRes.json();
    }

    // Fetch PENDING commands
    const pendingRes = await fetch(`${BASE_URL}/commands?status=PENDING`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    let pending: any[] = [];
    if (pendingRes.ok) {
      pending = await pendingRes.json();
    }

    // Combine and filter results
    const allCommands = [...waiting, ...pending];
    return allCommands.filter(
      (cmd: any) => cmd.status === 'WAITING' || cmd.status === 'PENDING',
    );
  } catch (error) {
    throw new Error('Failed to fetch commands');
  }
};

// Fetch stock jobs for assignment
export const fetchStockJobsForAssignment = async (): Promise<
  StockJobAssignmentData[]
> => {
  try {
    const res = await fetch(`${BASE_URL}/locations`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch locations');
    }

    const locations: WarehouseLocation[] = await res.json();
    const locationsById = new Map(locations.map((location) => [location.id, location]));

    const jobs = locations.flatMap((sourceLocation) => {
      return (sourceLocation.pendingJobs ?? []).map((job) => {
        const sourceArticle = sourceLocation.articles.find(
          (article) => article.id === job.sourceArticleId,
        );
        const targetLocation =
          job.targetLocationId != null
            ? locationsById.get(job.targetLocationId)
            : undefined;

        return {
          id: job.id,
          type: job.type,
          status: job.status,
          quantity: job.quantity,
          sourceArticle: {
            id: job.sourceArticleId,
            reference:
              sourceArticle?.reference ?? `ARTICLE-${job.sourceArticleId}`,
            label: sourceArticle?.label ?? 'Article',
          },
          targetLocation: targetLocation
            ? {
                id: targetLocation.id,
                building: targetLocation.building,
                aisle: targetLocation.aisle,
                shelf: targetLocation.shelf,
                cell: targetLocation.cell,
              }
            : undefined,
          assignedUserId: job.assignedUser.id,
          assignedUser: job.assignedUser,
          requestedAt: job.requestedAt,
        } satisfies StockJobAssignmentData;
      });
    });

    return jobs
      .filter((job) => job.status === 'PENDING')
      .sort(
        (a, b) =>
          new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime(),
      );
  } catch (error) {
    throw new Error('Failed to fetch stock jobs');
  }
};

// Fetch loading stages
export const fetchLoadingStages = async (): Promise<LoadingStageData[]> => {
  try {
    const res = await fetch(`${BASE_URL}/commands/loading-stages`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      // If endpoint doesn't exist, return empty array
      return [];
    }

    return res.json();
  } catch (error) {
    // Endpoint not available yet
    return [];
  }
};

// Update command assignment
export interface UpdateCommandAssignmentInput {
  userId: number;
}

export const updateCommandAssignment = async (
  commandId: number,
  data: UpdateCommandAssignmentInput,
): Promise<CommandAssignmentData> => {
  const res = await fetch(`${BASE_URL}/commands/${commandId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ userId: data.userId }),
  });

  if (!res.ok) throw new Error('Failed to update command assignment');

  return res.json();
};

// Update stock job assignment
export interface UpdateStockJobAssignmentInput {
  assignedUserId: number;
}

export const updateStockJobAssignment = async (
  jobId: number,
  data: UpdateStockJobAssignmentInput,
): Promise<StockJobAssignmentData> => {
  const res = await fetch(`${BASE_URL}/locations/jobs/${jobId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ assignedUserId: data.assignedUserId }),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, 'Failed to update stock job assignment'),
    );
  }

  return res.json();
};

// Update loading stage
export interface UpdateLoadingStageInput {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export const updateLoadingStage = async (
  stageId: number,
  data: UpdateLoadingStageInput,
): Promise<LoadingStageData> => {
  const res = await fetch(`${BASE_URL}/commands/loading-stages/${stageId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status: data.status }),
  });

  if (!res.ok) throw new Error('Failed to update loading stage');

  return res.json();
};
