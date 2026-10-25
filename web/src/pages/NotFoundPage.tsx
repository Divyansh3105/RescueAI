import { useEffect } from 'react';
import { useSession } from '@/auth/session';
import { Link } from '@/components/Link';
import { homeFor } from '@/routes';

export function NotFoundPage() {
  const { user } = useSession();
  useEffect(() => {
    document.title = 'Page not found · RescueAI';
  }, []);
  return (
    <main id="content" className="mx-auto max-w-lg space-y-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">This page doesn’t exist.</h1>
      <p className="text-muted-foreground">Check the address, or go back to the start.</p>
      <Link
        to={user ? homeFor(user.role) : '/'}
        className="text-primary underline underline-offset-4"
      >
        {user ? 'Go to your home page' : 'Ask for rescue'}
      </Link>
    </main>
  );
}
