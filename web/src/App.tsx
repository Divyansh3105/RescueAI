import { RequireRole } from '@/auth/RequireRole';
import { useLogout, useSession } from '@/auth/session';
import { Button } from '@/components/ui/button';
import { LoginPage } from '@/pages/login/LoginPage';
import { usePath } from '@/router';
import { rolesFor, roleLabel } from '@/routes';
import { CitizenForm } from './prototype/CitizenForm';

// Temporary until the shells land (plan Task 6): proves the sign-in flow end to end.
function SignedInPlaceholder() {
  const { user } = useSession();
  const logout = useLogout();
  return (
    <main id="content" className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Signed in</h1>
      <p>
        {user?.name} · {user && roleLabel[user.role]}
      </p>
      <Button variant="outline" onClick={() => logout.mutate()}>
        Sign out
      </Button>
    </main>
  );
}

export default function App() {
  const { path } = usePath();
  if (path === '/login') return <LoginPage />;
  const roles = rolesFor(path);
  if (roles === 'public') return <CitizenForm />;
  return (
    <RequireRole roles={roles}>
      <SignedInPlaceholder />
    </RequireRole>
  );
}
