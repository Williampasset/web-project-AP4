// frontend/src/hooks/command-preparation.hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  markItemPicked,
  validateItem,
  moveToLoadingZone,
  simulateRfidCheck,
  loadItemToTruck,
  completeLoading,
  getPreparationStatus,
} from '../service/api/command-preparation-api.service';

/**
 * Hook to mark a command item as picked
 */
export const useMarkItemPicked = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commandItemId,
    }: {
      commandItemId: number;
      commandId: number;
    }) => {
      return markItemPicked(commandItemId);
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['command', variables.commandId],
      });
      queryClient.invalidateQueries({
        queryKey: ['preparation-status', variables.commandId],
      });
    },
  });
};

/**
 * Hook to validate a picked item
 */
export const useValidateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: validateItem,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['preparation-status'],
      });
    },
  });
};

/**
 * Hook to move items to loading zone
 */
export const useMoveToLoadingZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commandId }: { commandId: number }) =>
      moveToLoadingZone(commandId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['preparation-status', variables.commandId],
      });
    },
  });
};

/**
 * Hook to simulate RFID check
 */
export const useSimulateRfidCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commandId,
      checksPassed,
      checksFailed,
    }: {
      commandId: number;
      checksPassed: number;
      checksFailed?: number;
    }) => simulateRfidCheck(commandId, checksPassed, checksFailed),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['preparation-status', variables.commandId],
      });
    },
  });
};

/**
 * Hook to load item to truck
 */
export const useLoadItemToTruck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loadItemToTruck,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['preparation-status'],
      });
    },
  });
};

/**
 * Hook to complete loading
 */
export const useCompleteLoading = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commandId }: { commandId: number }) =>
      completeLoading(commandId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['preparation-status', variables.commandId],
      });
      queryClient.invalidateQueries({
        queryKey: ['command', variables.commandId],
      });
    },
  });
};

/**
 * Hook to get preparation status
 */
export const usePreparationStatus = (commandId: number) => {
  return useQuery({
    queryKey: ['preparation-status', commandId],
    queryFn: () => getPreparationStatus(commandId),
    enabled: !!commandId,
    refetchInterval: 5000,
  });
};
