import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MULTI_WORLD_EXPORT_TARGETS, type MultiWorldExportTargetId } from "@/constants/sequence-world/multiverse/multiWorldExportTargets";
import { exportMultiWorldRuntime } from "@/lib/sequence-world/multiverse/multiWorldRuntimeExportEngine";
import type { MultiWorldNetworkResult } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";
import type { SubjectMode } from "@/lib/sequence-world/multiverse/types";

interface Props {
  result: MultiWorldNetworkResult;
  subjectMode: SubjectMode;
}

export function MultiWorldExportPanel({ result, subjectMode }: Props) {
  const [out, setOut] = useState<string>("");
  const [target, setTarget] = useState<MultiWorldExportTargetId>("GENERIC_JSON");

  const doExport = (t: MultiWorldExportTargetId) => {
    setTarget(t);
    const exp = exportMultiWorldRuntime({
      target: t,
      subjectMode,
      pack: {
        worlds: result.worlds,
        portals: result.portals,
        relations: result.crossWorldRelations,
        travelState: result.userTravelState,
        transfers: result.transfers,
        migrations: result.agentMigrations,
        crossWorldCanon: result.crossWorldCanon,
        events: result.multiWorldEvents,
        federation: result.federation,
        conflicts: result.conflicts,
        syncState: result.syncState,
        safetyNotes: result.safetyNotes,
      },
    });
    setOut(typeof exp.payload === "string" ? exp.payload : JSON.stringify(exp.payload, null, 2));
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">多世界导出 · Export</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {MULTI_WORLD_EXPORT_TARGETS.map((t) => (
          <Button key={t.id} size="sm" variant={target === t.id ? "default" : "outline"} onClick={() => doExport(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>
      {out ? (
        <>
          <Badge variant="outline" className="text-[10px] mb-2">{target}</Badge>
          <pre className="text-[10px] bg-muted/30 rounded p-2 max-h-72 overflow-auto">{out.slice(0, 4000)}</pre>
        </>
      ) : (
        <div className="text-xs text-muted-foreground">选择导出目标。导出包含 metadata、source、version、subjectMode、privacyNotes。</div>
      )}
    </Card>
  );
}
