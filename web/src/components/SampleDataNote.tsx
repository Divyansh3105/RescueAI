/** Marks a screen that shows sample data, so nobody mistakes it for a working feature. */
export function SampleDataNote({ text = 'Sample data — not connected yet.' }: { text?: string }) {
  return (
    <p className="text-muted-foreground bg-muted rounded-md border px-3 py-2 text-sm">{text}</p>
  );
}
