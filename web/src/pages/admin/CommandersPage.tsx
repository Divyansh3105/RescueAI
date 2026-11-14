import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError, apiFetch } from '@/lib/api';
import { normalizePhone } from '@/lib/phone';
import { CommanderShell } from '@/shells/CommanderShell';

type Role = 'onsite_commander' | 'office_commander';

// One row of GET /api/admin/commanders. No phone number: the Admin doesn't need it (AC18).
interface Commander {
  id: string;
  name: string;
  role: Role;
  active: boolean;
}

const roleLabel: Record<Role, string> = {
  onsite_commander: 'On-site commander',
  office_commander: 'Office commander',
};

const messageOf = (e: unknown) =>
  e instanceof ApiError
    ? (Object.values(e.fields ?? {})[0] ?? e.message)
    : 'Something went wrong. Try again.';

/** Create, deactivate and reactivate commander accounts (PRD Target Users, AC18). */
export function CommandersPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['commanders'],
    queryFn: () =>
      apiFetch<{ commanders: Commander[] }>('/api/admin/commanders').then((r) => r.commanders),
  });
  const rows = q.data ?? [];
  const [form, setForm] = useState<{ name: string; phone: string; role: Role }>({
    name: '',
    phone: '',
    role: 'onsite_commander',
  });
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; password: string } | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ['commanders'] });
  const createAccount = useMutation({
    mutationFn: (body: { name: string; phone: string; role: Role }) =>
      apiFetch<{ user: Commander; temporaryPassword: string }>('/api/admin/commanders', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: ({ user, temporaryPassword }) => {
      setCreated({ name: user.name, password: temporaryPassword });
      setForm((f) => ({ name: '', phone: '', role: f.role }));
      void refresh();
    },
    onError: (e) => setError(messageOf(e)),
  });
  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch(`/api/admin/commanders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      }),
    onSettled: refresh,
    onError: (e) => setError(messageOf(e)),
  });

  function create(e: FormEvent) {
    e.preventDefault();
    setCreated(null);
    if (!form.name.trim()) return setError('Enter the commander’s name.');
    const phone = normalizePhone(form.phone);
    if (!phone) return setError('Enter a 10-digit mobile number.');
    setError(null);
    createAccount.mutate({ name: form.name.trim(), phone, role: form.role });
  }

  return (
    <CommanderShell
      title="Commanders"
      description="On-site commanders select responders. Office commanders approve. Only the Admin creates these accounts."
    >
      <div className="max-w-4xl space-y-6 px-4 pb-6 lg:px-6">
        {q.isPending ? (
          <p className="text-muted-foreground">Loading commanders…</p>
        ) : q.error ? (
          <p role="alert" className="text-red-700">
            {q.error instanceof ApiError ? q.error.message : 'Could not load the commanders.'}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No commander accounts yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{roleLabel[a.role]}</TableCell>
                    <TableCell>{a.active ? 'Active' : 'Deactivated'}</TableCell>
                    <TableCell className="text-right">
                      {!a.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={setActive.isPending}
                          onClick={() => setActive.mutate({ id: a.id, active: true })}
                        >
                          Reactivate
                        </Button>
                      )}
                      {a.active && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Deactivate
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate {a.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They are signed out at once and can’t sign in again until an Admin
                                reactivates them.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => setActive.mutate({ id: a.id, active: false })}
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <form noValidate onSubmit={create} className="space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Create a commander account</h2>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {created && (
            <Alert>
              <AlertDescription>
                Account created for {created.name}. Temporary password:{' '}
                <strong className="font-mono text-base tracking-wider">{created.password}</strong>.
                Read it to them now: it is not shown again.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="c-name">Name (required)</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-phone">Mobile number (required)</Label>
              <Input
                id="c-phone"
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-role">Role (required)</Label>
              <select
                id="c-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent px-3 focus-visible:ring-2 focus-visible:outline-none"
              >
                <option value="onsite_commander">On-site commander</option>
                <option value="office_commander">Office commander</option>
              </select>
            </div>
          </div>
          <p className="text-muted-foreground">
            A temporary password is shown once after creation. Read it to the commander.
          </p>
          <Button type="submit" disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      </div>
    </CommanderShell>
  );
}
