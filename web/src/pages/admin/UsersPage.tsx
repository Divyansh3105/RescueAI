import { useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { accounts } from '@/sample/data';
import { CommanderShell } from '@/shells/CommanderShell';

/** Admin password reset (PRD AC25, D-051). Sample only: the shown password is made up. */
export function UsersPage() {
  const [query, setQuery] = useState('');
  const [reset, setReset] = useState<{ name: string; temp: string } | null>(null);
  const q = query.trim().toLowerCase();
  // ponytail: in-memory filter over sample rows; the API search replaces it.
  const rows = accounts.filter((a) => !q || a.name.toLowerCase().includes(q));

  return (
    <CommanderShell
      title="Users"
      description="Reset a forgotten password. The temporary password is shown once."
    >
      <div className="max-w-4xl space-y-4 px-4 pb-6 lg:px-6">
        <SampleDataNote />
        {reset && (
          <Alert>
            <AlertTitle>Temporary password for {reset.name}</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="font-mono text-lg tracking-wider">{reset.temp}</p>
              <p>
                This password is shown only once. Read it to the user now; they should change it
                after signing in. (Sample: nothing was changed.)
              </p>
              <Button variant="outline" onClick={() => setReset(null)}>
                Done
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="max-w-sm space-y-1">
          <Label htmlFor="user-search">Search by name</Label>
          <Input id="user-search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No users match.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.role}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Reset password
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset {a.name}’s password?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Their current password stops working and they are signed out everywhere.
                            A temporary password is shown once. This is recorded in the audit log.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => setReset({ name: a.name, temp: 'SAMPLE-0000' })}
                          >
                            Reset password
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </CommanderShell>
  );
}
