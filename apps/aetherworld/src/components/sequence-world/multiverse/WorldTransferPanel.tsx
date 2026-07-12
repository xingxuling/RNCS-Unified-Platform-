import { Card } from "@/components/ui/card";
import type { WorldTransferRecord } from "@/lib/sequence-world/multiverse/types";

export function WorldTransferPanel({ transfers }: { transfers: WorldTransferRecord[] }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">世界转移 · Transfers</h3>
      {transfers.length === 0 ? (
        <div className="text-xs text-muted-foreground">暂无跨世界转移。内部虚拟资产，不可现实兑现。</div>
      ) : (
        <ul className="text-xs space-y-1">
          {transfers.map((t) => (
            <li key={t.transferId} className="rounded border border-border/50 p-2">
              <div className="font-mono">{t.transferType} · {t.assetSummary}</div>
              <div className="text-[11px] text-muted-foreground">{t.allowed ? "✅ 允许" : "🚫 拒绝"} — {t.reason}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
