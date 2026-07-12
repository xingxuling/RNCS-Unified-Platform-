import type { VirtualWorldState } from "@/lib/virtualWorldEngine";

export function WorldMemoryPanel({ state }: { state: VirtualWorldState }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Memory · 世界记忆</div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <Field label="世界等级" value={`LV ${state.worldLevel}`} />
        <Field label="稳定度" value={`${state.stabilityScore}/100`} />
        <Field label="乱流度" value={`${state.chaosScore}/100`} />
        <Field label="状态" value={state.stale ? "需要重算" : "最新"} accent={state.stale} />
        <Field label="模式" value={state.worldMode} />
        <Field label="生成时间" value={new Date(state.generatedAt).toLocaleString()} />
        <Field label="主体ID" value={state.subjectId} />
        <Field label="世界ID" value={state.worldId} />
      </div>
    </div>
  );
}
function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`mt-0.5 ${accent ? "text-amber-400" : "text-foreground/90"}`}>{value}</div>
    </div>
  );
}
