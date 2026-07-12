import { useMemo } from "react";
import { loadMemory } from "@/lib/localEvolutionMemory";
import { EVOLUTION_SIGNAL_TYPES, getSignalDef } from "@/constants/evolutionSignals";

export function EvolutionSignalPanel() {
  const mem = useMemo(() => loadMemory(), []);
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of mem.signals) out[s.type] = (out[s.type] ?? 0) + 1;
    return out;
  }, [mem]);
  const recent = mem.signals.slice(-12).reverse();

  return (
    <div className="aether-card-elevated p-5 space-y-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Evolution Signals · 本地使用信号</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {EVOLUTION_SIGNAL_TYPES.map(s => (
          <div key={s.id} className="aether-card p-2.5">
            <div className="text-[10px] text-muted-foreground">{s.name}</div>
            <div className="text-sm mt-0.5">{counts[s.id] ?? 0}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">最近信号</div>
        {recent.length === 0 ? (
          <div className="text-xs text-muted-foreground">尚无信号 — 开始使用产品，本地进化系统会自动记录。</div>
        ) : (
          <ul className="text-xs space-y-1">
            {recent.map(s => (
              <li key={s.id} className="flex items-center justify-between">
                <span>{getSignalDef(s.type)?.name ?? s.type}{s.moduleId ? ` · ${s.moduleId}` : ""}</span>
                <span className="text-muted-foreground">{new Date(s.timestamp).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
