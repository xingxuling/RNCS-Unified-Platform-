import { useState } from "react";
import type { VirtualLifeQuest } from "@/lib/virtualLifeQuestEngine";

export function VirtualLifeQuestBoard({
  main, sides, onComplete,
}: {
  main: VirtualLifeQuest;
  sides: VirtualLifeQuest[];
  onComplete?: (questId: string, done: boolean) => void;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => {
    const next = !done[id];
    setDone(s => ({ ...s, [id]: next }));
    onComplete?.(id, next);
  };

  return (
    <div className="aether-card p-5 space-y-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Quest Board · 今日任务</div>
      <QuestRow q={main} primary done={!!done[main.id]} onToggle={() => toggle(main.id)} />
      <div className="gold-divider" />
      <div className="space-y-2">
        {sides.map(q => (
          <QuestRow key={q.id} q={q} done={!!done[q.id]} onToggle={() => toggle(q.id)} />
        ))}
      </div>
    </div>
  );
}

function QuestRow({ q, primary, done, onToggle }: { q: VirtualLifeQuest; primary?: boolean; done: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded border ${primary ? "border-primary/40 bg-primary/5" : "border-border/30"} p-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className={primary ? "text-primary" : "text-foreground"}>{q.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border/30 text-muted-foreground">{q.questTypeName}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{q.virtualDescription}</div>
          <div className="text-[11px]"><span className="text-primary">现实：</span>{q.realWorldAction}</div>
          <div className="text-[10px] text-muted-foreground">验证：{q.validationMethod}</div>
        </div>
        <button onClick={onToggle}
          className={`text-[11px] px-2.5 py-1.5 rounded border ${done ? "bg-primary/30 border-primary/40 text-primary-foreground" : "bg-background/40 border-border/40"}`}>
          {done ? "已完成" : "标记完成"}
        </button>
      </div>
    </div>
  );
}
