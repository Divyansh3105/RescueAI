import { SampleDataNote } from '@/components/SampleDataNote';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { auditLog } from '@/sample/data';
import { CommanderShell } from '@/shells/CommanderShell';

/** The append-only audit log, read-only (PRD F11). Shared by commanders and the Admin. Sample only. */
export function AuditPage() {
  return (
    <CommanderShell
      title="Audit Log"
      description="Every selection, approval and admin change. Entries can't be edited or deleted."
    >
      <div className="space-y-4 px-4 pb-6 lg:px-6">
        <SampleDataNote />
        {auditLog.length === 0 ? (
          <p className="text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Time (IST)</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((e) => (
                  <TableRow key={`${e.at}-${e.action}`}>
                    <TableCell className="tabular-nums">{e.at}</TableCell>
                    <TableCell>
                      <span className="font-medium">{e.actor}</span>
                      <span className="text-muted-foreground block text-xs">{e.role}</span>
                    </TableCell>
                    <TableCell className="whitespace-normal">{e.action}</TableCell>
                    <TableCell>{e.target}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </CommanderShell>
  );
}
