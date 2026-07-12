import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPresentationSnapshot, loadPresentationSnapshots, type PresentationSnapshot } from "@/lib/sequence-world/presentation/presentationSnapshotEngine";
import type { WorldPresentationResult } from "@/lib/sequence-world/presentation/worldPresentationRuntime";

export function PresentationSnapshotPanel({ presentation }: { presentation: WorldPresentationResult | null }) {
  const [list, setList] = useState<PresentationSnapshot[]>(loadPresentationSnapshots());
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">表现层快照 · Presentation Snapshots ({list.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Button size="sm" disabled={!presentation} onClick={() => {
          if (!presentation) return;
          createPresentationSnapshot(presentation);
          setList(loadPresentationSnapshots());
        }}>保存当前表现快照</Button>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {list.slice().reverse().map(s => (
            <div key={s.snapshotId} className="border rounded p-2 text-xs">
              <div className="font-medium">{s.snapshotId} · tick {s.tick}</div>
              <div className="text-muted-foreground">{s.renderSummary} | {s.cameraSummary} | {s.audioSummary}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
