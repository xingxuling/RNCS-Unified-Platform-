import { Card } from "@/components/ui/card";

export function MultiWorldSafetyNote({ notes }: { notes: string[] }) {
  return (
    <Card className="p-4 border-amber-500/30 bg-amber-500/5">
      <div className="text-[11px] font-semibold text-amber-300 mb-1">安全边界 · Safety Boundary</div>
      <ul className="text-[11px] text-muted-foreground space-y-1">
        {notes.map((n, i) => (
          <li key={i}>· {n}</li>
        ))}
      </ul>
    </Card>
  );
}
