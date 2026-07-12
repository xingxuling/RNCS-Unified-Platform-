import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runMultiWorldNetwork, listExampleMultiWorldPrograms, type MultiWorldNetworkResult } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";
import { MultiWorldSafetyNote } from "./MultiWorldSafetyNote";
import { WorldRegistryPanel } from "./WorldRegistryPanel";
import { WorldPortalPanel } from "./WorldPortalPanel";
import { CrossWorldRelationGraph } from "./CrossWorldRelationGraph";
import { WorldTravelPanel } from "./WorldTravelPanel";
import { WorldTransferPanel } from "./WorldTransferPanel";
import { AgentMigrationPanel } from "./AgentMigrationPanel";
import { CrossWorldCanonPanel } from "./CrossWorldCanonPanel";
import { MultiWorldEventPanel } from "./MultiWorldEventPanel";
import { WorldFederationPanel } from "./WorldFederationPanel";
import { WorldConflictPanel } from "./WorldConflictPanel";
import { WorldSyncPanel } from "./WorldSyncPanel";
import { MultiWorldSnapshotPanel } from "./MultiWorldSnapshotPanel";
import { MultiWorldExportPanel } from "./MultiWorldExportPanel";

interface Props {
  subjectMode?: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
}

export function MultiWorldNetworkPanel({ subjectMode = "DEMO" }: Props) {
  const [seed, setSeed] = useState(0);
  const result: MultiWorldNetworkResult = useMemo(
    () => runMultiWorldNetwork({ subjectMode, maxWorlds: 7 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, subjectMode],
  );
  const examples = listExampleMultiWorldPrograms();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-xl gold-text">Multi-World Network Runtime v0.7</h2>
            <p className="text-xs text-muted-foreground mt-1">数列驱动多世界网络与世界门户运行时</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setSeed((s) => s + 1)}>
            重新运行
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Metric label="世界数" value={result.worlds.length} />
          <Metric label="门户数" value={result.portals.length} />
          <Metric label="关系数" value={result.crossWorldRelations.length} />
          <Metric label="联邦" value={result.federation ? 1 : 0} />
          <Metric label="冲突" value={result.conflicts.length} />
          <Metric label="同步模式" value={result.syncState.syncMode} />
          <Metric label="网络模式" value={result.networkMode} />
          <Metric label="隐私" value={result.worlds[0]?.privacyLevel ?? "—"} />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {result.exportOptions.slice(0, 6).map((opt) => (
            <Badge key={opt} variant="outline" className="text-[10px]">{opt}</Badge>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-2">预置示例</h3>
        <ul className="text-xs space-y-1 text-muted-foreground">
          {examples.map((e) => (
            <li key={e.title}>• <span className="text-foreground">{e.title}</span>：{e.prompt}</li>
          ))}
        </ul>
      </Card>

      <WorldRegistryPanel worlds={result.worlds} />
      <WorldPortalPanel portals={result.portals} worlds={result.worlds} />
      <CrossWorldRelationGraph relations={result.crossWorldRelations} worlds={result.worlds} />
      <WorldTravelPanel worlds={result.worlds} portals={result.portals} state={result.userTravelState} />
      <WorldTransferPanel transfers={result.transfers} />
      <AgentMigrationPanel migrations={result.agentMigrations} />
      <CrossWorldCanonPanel canon={result.crossWorldCanon} />
      <MultiWorldEventPanel events={result.multiWorldEvents} />
      <WorldFederationPanel federation={result.federation} />
      <WorldConflictPanel conflicts={result.conflicts} />
      <WorldSyncPanel syncState={result.syncState} />
      <MultiWorldSnapshotPanel snapshots={result.snapshots} />
      <MultiWorldExportPanel result={result} subjectMode={subjectMode} />

      <MultiWorldSafetyNote notes={result.safetyNotes} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border/50 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{String(value)}</div>
    </div>
  );
}
