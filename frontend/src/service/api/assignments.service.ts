import { getHeaders } from './api.helper';

const BASE_URL = 'http://localhost:3000';

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
    // Try to fetch from an endpoint that lists all pending jobs
    // For now, return empty array if endpoint doesn't exist
    const res = await fetch(`${BASE_URL}/stock-jobs?status=PENDING`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      // Endpoint doesn't exist yet, return empty array
      return [];
    }

    const data = await res.json();
    return data.filter((job: any) => job.status === 'PENDING');
  } catch (error) {
    // Endpoint not available yet
    return [];
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

  if (!res.ok) throw new Error('Failed to update stock job assignment');

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
