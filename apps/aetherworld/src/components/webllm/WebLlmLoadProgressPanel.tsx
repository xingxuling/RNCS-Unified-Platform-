import { useEffect, useState } from "react";
import { getEngineState, subscribeEngine, type WebLlmEngineState } from "@/lib/webllm/webLlmEngineLoader";

export function WebLlmLoadProgressPanel() {
  const [s, setS] = useState<WebLlmEngineState>(getEngineState());
  useEffect(() => subscribeEngine(setS), []);
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Engine · 引擎状态</div>
      <div className="flex items-center justify-between text-[12px]">
        <span>状态</span><span className="font-mono">{s.status}</span>
      </div>
      <div className="flex items-center justify-between text-[12px]">
        <span>模型</span><span className="font-mono">{s.modelId || "—"}</span>
      </div>
      <div className="h-2 rounded bg-border/30 overflow-hidden">
        <div className="h-full bg-primary/60 transition-all" style={{ width: `${Math.round(s.loadingProgress * 100)}%` }} />
      </div>
      <div className="text-[11px] text-muted-foreground">{s.loadingMessage || s.errorMessage || "等待加载…"}</div>
    </div>
  );
}
