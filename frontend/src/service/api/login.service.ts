/**
 * Login service to authenticate users.
 * @param data Object containing matricule and password for authentication.
 * @returns A promise that resolves to the authentication response from the server.
 * @throws An error if the login request fails.
 */
export const login = async (data: { matricule: string; password: string }) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Login failed');
  }

  return res.json();
};
