import { useEffect, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '@/components/PageSpinner';
import { navigate, usePath } from '@/router';
import { homeFor, type Role } from '@/routes';
import { useSession } from './session';

/**
 * Shows children only to a signed-in user with one of `roles`. Signed out → /login with a
 * way back; wrong role → their own home. Cosmetic: the API is the real guard.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, isLoading, error, refetch } = useSession();
  const { path, search } = usePath();
  const query = search.toString();

  const target =
    user === null
      ? `/login?next=${encodeURIComponent(query ? `${path}?${query}` : path)}`
      : user && !roles.includes(user.role)
        ? homeFor(user.role)
        : null;

  useEffect(() => {
    if (target) navigate(target, { replace: true });
  }, [target]);

  if (error && user === undefined) {
    return (
      <main className="mx-auto max-w-lg p-4">
        <Alert variant="destructive">
          <AlertTitle>Could not reach RescueAI</AlertTitle>
          <AlertDescription>
            Check your connection and try again.
            <Button variant="outline" className="mt-2" onClick={() => void refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  if (isLoading || target || !user) return <PageSpinner />;
  return children;
}
