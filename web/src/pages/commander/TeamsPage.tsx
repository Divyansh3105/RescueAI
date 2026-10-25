import { SkillChip } from '@/components/domain';
import { SampleDataNote } from '@/components/SampleDataNote';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { teams } from '@/sample/data';
import { CommanderShell } from '@/shells/CommanderShell';

/** SDRF/NDRF teams with base and capabilities (PRD F4). Sample only. */
export function TeamsPage() {
  return (
    <CommanderShell title="Teams" description="SDRF and NDRF rescue teams. Teams have no login.">
      <div className="space-y-4 px-4 pb-6 lg:px-6">
        <SampleDataNote />
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Force</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.force}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.capabilities.map((c) => (
                        <SkillChip key={c} skill={c} verified />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{t.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </CommanderShell>
  );
}
