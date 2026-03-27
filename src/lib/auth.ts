import { createAuthClient } from '@neondatabase/neon-js/auth';
export const authClient = createAuthClient(
    import.meta.env.VITE_NEON_AUTH_URL
)

export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await authClient.getSession();
    if (session?.data?.session?.token) {
      return session.data.session.token;
    }
    return null;
  } catch {
    return null;
  }
}