import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { exportMarkdownReport, type SequenceWorldExport } from "@/lib/sequence-world/engineExportAdapter";

export function SequenceWorldReport({ world }: { world: SequenceWorldExport }) {
  const md = useMemo(() => exportMarkdownReport(world), [world]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sequence World Report</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea readOnly value={md} rows={20} className="font-mono text-xs" />
      </CardContent>
    </Card>
  );
}
