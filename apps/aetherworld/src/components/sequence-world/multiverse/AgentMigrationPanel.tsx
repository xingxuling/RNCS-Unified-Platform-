import { Card } from "@/components/ui/card";
import type { AgentMigrationRecord } from "@/lib/sequence-world/multiverse/types";

export function AgentMigrationPanel({ migrations }: { migrations: AgentMigrationRecord[] }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">智能体迁移 · Agent Migration</h3>
      {migrations.length === 0 ? (
        <div className="text-xs text-muted-foreground">暂无 NPC / Agent 迁移记录。默认仅迁移 memory summary。</div>
      ) : (
        <ul className="text-xs space-y-1">
          {migrations.map((m) => (
            <li key={m.migrationId} className="rounded border border-border/50 p-2">
              <div className="font-mono">{m.agentId}：{m.fromWorldId} → {m.toWorldId}</div>
              <div className="text-[11px] text-muted-foreground">memory: {m.memoryTransferMode} · canon: {m.canonStatus}</div>
              {m.risks.length > 0 && <div className="text-[10px] text-amber-400">⚠ {m.risks.join("；")}</div>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
