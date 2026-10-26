import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { navigate } from '@/router';
import type { User } from '@/routes';

export const sessionKey = ['session'] as const;

async function fetchMe(): Promise<User | null> {
  try {
    return (await apiFetch<{ user: User }>('/api/auth/me')).user;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

/** The signed-in user: undefined while loading or on error, null when signed out. */
export function useSession() {
  const q = useQuery({ queryKey: sessionKey, queryFn: fetchMe, retry: false, staleTime: 60_000 });
  return { user: q.data, isLoading: q.isPending, error: q.error, refetch: q.refetch };
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { phone: string; password: string }) =>
      apiFetch<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: ({ user }) => qc.setQueryData(sessionKey, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
    // Signed out locally even if the request failed: the cookie is the server's to clear,
    // and the next /me call tells the truth either way.
    onSettled: () => {
      qc.clear();
      qc.setQueryData(sessionKey, null);
      navigate('/login', { replace: true });
    },
  });
}
