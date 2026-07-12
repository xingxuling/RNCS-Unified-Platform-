import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorldFederationState } from "@/lib/sequence-world/multiverse/types";

export function WorldFederationPanel({ federation }: { federation?: WorldFederationState }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">世界联邦 · World Federation</h3>
      {!federation ? (
        <div className="text-xs text-muted-foreground">尚未形成稳定联邦。需要至少 1 条 trust ≥ 0.6 且 conflict ≤ 0.4 的关系。</div>
      ) : (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{federation.name}</span>
            <Badge variant="outline" className="text-[10px]">{federation.federationType}</Badge>
            {federation.founderLocked && <Badge variant="destructive" className="text-[10px]">FOUNDER_LOCKED</Badge>}
          </div>
          <div className="text-[11px]">成员：{federation.memberWorldIds.length} 个世界</div>
          <div className="text-[11px]">治理：{federation.governanceModel} · 稳定 {federation.stability.toFixed(2)} · 冲突风险 {federation.conflictRisk.toFixed(2)}</div>
          <div className="text-[11px] text-muted-foreground">规则：{federation.sharedRules.join("；")}</div>
        </div>
      )}
    </Card>
  );
}
