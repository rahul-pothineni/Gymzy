import { createAuthClient } from '@neondatabase/neon-js/auth';
export const authClient = createAuthClient(
    import.meta.env.VITE_NEON_AUTH_URL
)

export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await authClient.getSession();
    const data = session?.data as any;

    if (data?.session?.token) return data.session.token;
    if (data?.token) return data.token;
    if (data?.accessToken) return data.accessToken;

    return null;
  } catch {
    return null;
  }
}
