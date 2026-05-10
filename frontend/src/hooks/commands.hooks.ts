// hooks/commands.hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCommands,
  fetchCommandById,
  createCommand,
  updateCommand,
  updateCommandStatus,
  deleteCommand,
} from '../service/api/commands.service';
import type { Command } from '@type/command.type';

/**
 * Custom hooks for managing commands using react-query.
 * These hooks provide an interface for fetching, creating, updating, and deleting commands,
 * while automatically handling caching and state management.
 * @param filters - Optional filters for fetching commands, such as status and userId.
 * @returns An object containing the query and mutation functions for commands.
 */
export const useCommands = (filters?: { status?: string; userId?: number }) => {
  return useQuery<Command[]>({
    queryKey: ['commands', filters],
    queryFn: () => fetchCommands(filters),
  });
};

/**
 * Custom hook to fetch a single command by its ID.
 * @param id - The ID of the command to fetch.
 * @returns An object containing the query function for fetching a command by ID, along with its state (loading, error, etc.).
 * The query will only run if a valid ID is provided (enabled: !!id).
 */
export const useCommand = (id: number) => {
  return useQuery<Command>({
    queryKey: ['command', id],
    queryFn: () => fetchCommandById(id),
    enabled: !!id,
  });
};

/**
 * Custom hook to create a new command.
 * On success, it invalidates the 'commands' query to ensure the list of commands is updated.
 * @returns An object containing the mutation function for creating a command, along with its state (loading, error, etc.).
 * The mutation function can be called with the necessary data to create a command, and it will handle the API request and cache invalidation automatically.
 */
export const useCreateCommand = () => {
  const queryClient = useQueryClient();

  return useMutation<Command, unknown, Omit<Command, 'id'>>({
    mutationFn: createCommand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
};

/**
 * Custom hook to update an existing command.
 * @returns An object containing the mutation function for updating a command, along with its state (loading, error, etc.).
 * The mutation function can be called with the command ID and the data to update,
 * and it will handle the API request and cache invalidation automatically.
 */
export const useUpdateCommand = () => {
  const queryClient = useQueryClient();

  return useMutation<Command, unknown, { id: number; data: Partial<Command> }>({
    mutationFn: ({ id, data }) => updateCommand({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
};

/**
 * Custom hook to update the status of an existing command.
 * @returns An object containing the mutation function for updating a command's status, along with its state (loading, error, etc.).
 * The mutation function can be called with the command ID and the new status,
 */
export const useUpdateCommandStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCommandStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
};

/**
 * Custom hook to delete a command by its ID.
 * @returns An object containing the mutation function for deleting a command,
 * along with its state (loading, error, etc.).
 * The mutation function can be called with the command ID to delete,
 * and it will handle the API request and cache invalidation automatically.
 */
export const useDeleteCommand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCommand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
};
