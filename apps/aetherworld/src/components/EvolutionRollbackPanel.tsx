import { useState } from "react";
import { Button } from "@/components/ui/button";
import { listSnapshots, rollbackTo, rollbackLast, clearSnapshots } from "@/lib/evolutionRollbackManager";
import { resetProfile } from "@/lib/personalAppProfileEngine";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

export function EvolutionRollbackPanel({ onChange }: { onChange?: () => void }) {
  const [snapshots, setSnapshots] = useState(listSnapshots());
  const refresh = () => { setSnapshots(listSnapshots()); onChange?.(); };

  return (
    <div className="aether-card-elevated p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Rollback History · 回滚历史</div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => { if (rollbackLast()) { toast.success("已回滚最近一次进化"); refresh(); } else toast.error("没有可回滚的快照"); }}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />回滚最近
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { resetProfile(); toast.success("已恢复默认 App"); refresh(); }}>恢复默认</Button>
        </div>
      </div>
      {snapshots.length === 0 ? (
        <div className="text-xs text-muted-foreground">暂无快照。每次应用 mutation 前，系统会自动保存。</div>
      ) : (
        <ul className="text-xs space-y-2">
          {snapshots.map(s => (
            <li key={s.id} className="aether-card p-2.5 flex items-center justify-between">
              <div>
                <div>{s.reason}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleString()} · 信号 {s.memorySummaryBefore.signalCount}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => { if (rollbackTo(s.id)) { toast.success("已回滚"); refresh(); } }}>回滚到此</Button>
            </li>
          ))}
        </ul>
      )}
      {snapshots.length > 0 && (
        <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => { clearSnapshots(); toast.success("已清空快照"); refresh(); }}>
          清空快照
        </Button>
      )}
    </div>
  );
}
