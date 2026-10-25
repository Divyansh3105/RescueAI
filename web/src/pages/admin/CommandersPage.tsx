import { useState, type FormEvent } from 'react';
import { SampleDataNote } from '@/components/SampleDataNote';
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
import { normalizePhone } from '@/lib/phone';
import { accounts, type Account } from '@/sample/data';
import { CommanderShell } from '@/shells/CommanderShell';

/** Create and deactivate commander accounts (PRD F12, AC18). Sample only. */
export function CommandersPage() {
  const [rows, setRows] = useState<Account[]>(() =>
    accounts.filter((a) => a.role !== 'Volunteer' && a.role !== 'Admin'),
  );
  const [form, setForm] = useState({ name: '', phone: '', role: 'On-site commander' });
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  function create(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter the commander’s name.');
    if (!normalizePhone(form.phone)) return setError('Enter a 10-digit mobile number.');
    setError(null);
    setCreated(true);
    setForm({ name: '', phone: '', role: form.role });
  }

  return (
    <CommanderShell
      title="Commanders"
      description="On-site commanders select responders. Office commanders approve. Only the Admin creates these accounts."
    >
      <div className="max-w-4xl space-y-6 px-4 pb-6 lg:px-6">
        <SampleDataNote />
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
                  <TableCell>{a.role}</TableCell>
                  <TableCell>{a.active ? 'Active' : 'Deactivated'}</TableCell>
                  <TableCell className="text-right">
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
                              reactivates them. This is recorded in the audit log.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                setRows((r) =>
                                  r.map((x) => (x.id === a.id ? { ...x, active: false } : x)),
                                )
                              }
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

        <form noValidate onSubmit={create} className="space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Create a commander account</h2>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {created && !error && (
            <Alert>
              <AlertDescription>Not connected yet. No account was created.</AlertDescription>
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
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent px-3 focus-visible:ring-2 focus-visible:outline-none"
              >
                <option>On-site commander</option>
                <option>Office commander</option>
              </select>
            </div>
          </div>
          <p className="text-muted-foreground">
            A temporary password is shown once after creation. Read it to the commander.
          </p>
          <Button type="submit">Create account</Button>
        </form>
      </div>
    </CommanderShell>
  );
}
