import { listRhythms, getCurrentRhythm } from "@/lib/virtualRoutineEngine";

export function VirtualRoutinePanel() {
  const current = getCurrentRhythm();
  const list = listRhythms();
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Daily Rhythm · 日常节律</div>
      <div className="space-y-1">
        {list.map(r => {
          const active = r.id === current.id;
          return (
            <div key={r.id} className={`rounded px-3 py-2 border ${active ? "border-primary/40 bg-primary/5" : "border-border/30"}`}>
              <div className="flex justify-between text-xs">
                <span className={active ? "text-primary" : "text-foreground"}>{r.userFriendlyName}</span>
                <span className="text-muted-foreground">{r.hourRange[0]}:00 – {(r.hourRange[1] % 24)}:00</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{r.virtualScene}</div>
              <div className="text-[11px] mt-0.5">现实建议：{r.realAdvice}</div>
              <div className="text-[10px] text-amber-300/70 mt-0.5">提醒：{r.riskWarning}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
