/**
 * Helper function to get the headers for API requests,
 * including the Authorization token from localStorage.
 * @returns An object containing the necessary headers for API requests.
 */
export const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});
