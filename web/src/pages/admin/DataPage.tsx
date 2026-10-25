import { SampleDataNote } from '@/components/SampleDataNote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommanderShell } from '@/shells/CommanderShell';

/** Scenario loading and evaluation exports (PRD F14, AC20). Not connected yet. */
export function DataPage() {
  return (
    <CommanderShell
      title="Data"
      description="Load a scenario for a demo or evaluation run, and export results."
    >
      <div className="max-w-2xl space-y-6 px-4 pb-6 lg:px-6">
        <SampleDataNote text="Not connected yet. These controls are disabled until the scenario loader and exports exist." />
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Load a scenario</h2>
          <p className="text-muted-foreground">
            Synthetic requests, volunteers and teams. Loading replaces the current scenario data.
          </p>
          <div className="space-y-1">
            <Label htmlFor="scenario">Scenario file (.json)</Label>
            <Input id="scenario" type="file" accept=".json,application/json" disabled />
          </div>
          <Button disabled>Load scenario</Button>
        </section>
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Export as CSV</h2>
          <p className="text-muted-foreground">
            Times are in IST. Exports never include citizen phone numbers or volunteer locations.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled>
              Export request timestamps
            </Button>
            <Button variant="outline" disabled>
              Export audit log
            </Button>
          </div>
        </section>
      </div>
    </CommanderShell>
  );
}
