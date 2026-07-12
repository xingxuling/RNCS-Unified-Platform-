import { useSyncExternalStore } from "react";
import { getRealWebLlmRuntimeState, subscribeRealWebLlmRuntime } from "@/lib/real-webllm/aetherRealWebLlmRuntime";

const LABELS: Record<string, string> = {
  NOT_READY: "未准备",
  LOADING: "加载中",
  READY: "已就绪",
  GENERATING: "生成中",
  ERROR: "出错",
  UNSUPPORTED: "不支持",
  FALLBACK: "已降级",
};

const COLORS: Record<string, string> = {
  NOT_READY: "text-muted-foreground border-border/50",
  LOADING: "text-amber-400 border-amber-500/40",
  READY: "text-emerald-400 border-emerald-500/40",
  GENERATING: "text-blue-400 border-blue-500/40",
  ERROR: "text-rose-400 border-rose-500/40",
  UNSUPPORTED: "text-muted-foreground border-border/50",
  FALLBACK: "text-muted-foreground border-border/50",
};

export function RealWebLlmStatusBadge() {
  const s = useSyncExternalStore(subscribeRealWebLlmRuntime, getRealWebLlmRuntimeState, getRealWebLlmRuntimeState);
  const label = LABELS[s.engineStatus] ?? s.engineStatus;
  const color = COLORS[s.engineStatus] ?? COLORS.NOT_READY;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      WebLLM · {label}
    </span>
  );
}
