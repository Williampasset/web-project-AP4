// hooks/login.hooks.ts
import { useMutation } from '@tanstack/react-query';
import { login } from '../service/api/login.service';

/**
 * Custom hook to handle user login using react-query's useMutation.
 * @returns An object containing the mutation function and its state (loading, error, etc.).
 */
export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};
