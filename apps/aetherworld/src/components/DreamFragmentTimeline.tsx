import type { RecallFragment } from "@/lib/pastLifeRecallCalculus";
import { RECALL_SIGNAL_TYPES } from "@/constants/recallSignalTypes";

export function DreamFragmentTimeline({ fragments, onSelect, onDelete }: {
  fragments: RecallFragment[];
  onSelect?: (f: RecallFragment) => void;
  onDelete?: (id: string) => void;
}) {
  if (fragments.length === 0) {
    return <div className="aether-card p-4 text-xs text-muted-foreground">尚未记录任何潜意识材料。</div>;
  }
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Fragment Timeline · 记录时间线</div>
      <div className="space-y-2">
        {fragments.map(f => {
          const t = RECALL_SIGNAL_TYPES.find(x => x.id === f.fragmentType);
          return (
            <div key={f.id} className="flex items-start gap-3 border-l-2 border-border/40 pl-3 py-1">
              <div className="text-[10px] text-muted-foreground w-24 shrink-0">
                {new Date(f.createdAt).toLocaleDateString()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{f.title || "（未命名）"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t?.userFriendlyName} · {f.symbols.slice(0, 3).join("·") || "无符号"}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {onSelect && <button onClick={() => onSelect(f)} className="text-[11px] text-primary hover:underline">查看</button>}
                {onDelete && <button onClick={() => onDelete(f.id)} className="text-[11px] text-muted-foreground hover:text-destructive">删除</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
