import { useSyncExternalStore } from "react";
import { getRealWebLlmRuntimeState, subscribeRealWebLlmRuntime } from "@/lib/real-webllm/aetherRealWebLlmRuntime";

export function RealWebLlmLoadProgressPanel() {
  const s = useSyncExternalStore(subscribeRealWebLlmRuntime, getRealWebLlmRuntimeState, getRealWebLlmRuntimeState);
  if (s.engineStatus !== "LOADING" && s.engineStatus !== "READY") return null;
  const pct = Math.round((s.loadingProgress ?? 0) * 100);
  return (
    <div className="aether-card p-3 space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{s.loadingMessage ?? (s.engineStatus === "READY" ? "已就绪" : "加载中")}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${s.engineStatus === "READY" ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}
