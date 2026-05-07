import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchCommandsForAssignment,
  fetchStockJobsForAssignment,
  fetchLoadingStages,
  updateCommandAssignment,
  updateStockJobAssignment,
  updateLoadingStage,
  type CommandAssignmentData,
  type StockJobAssignmentData,
  type LoadingStageData,
  type UpdateCommandAssignmentInput,
  type UpdateStockJobAssignmentInput,
  type UpdateLoadingStageInput,
} from '../service/api/assignments.service';

export const useCommandsForAssignment = () => {
  return useQuery<CommandAssignmentData[]>({
    queryKey: ['commands-assignment'],
    queryFn: fetchCommandsForAssignment,
    refetchInterval: 10000,
  });
};

export const useStockJobsForAssignment = () => {
  return useQuery<StockJobAssignmentData[]>({
    queryKey: ['stock-jobs-assignment'],
    queryFn: fetchStockJobsForAssignment,
    refetchInterval: 10000,
  });
};

export const useLoadingStages = () => {
  return useQuery<LoadingStageData[]>({
    queryKey: ['loading-stages'],
    queryFn: fetchLoadingStages,
    refetchInterval: 10000,
  });
};

export const useUpdateCommandAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commandId,
      data,
    }: {
      commandId: number;
      data: UpdateCommandAssignmentInput;
    }) => updateCommandAssignment(commandId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands-assignment'] });
    },
  });
};

export const useUpdateStockJobAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: number;
      data: UpdateStockJobAssignmentInput;
    }) => updateStockJobAssignment(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-jobs-assignment'] });
    },
  });
};

export const useUpdateLoadingStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stageId,
      data,
    }: {
      stageId: number;
      data: UpdateLoadingStageInput;
    }) => updateLoadingStage(stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading-stages'] });
    },
  });
};
