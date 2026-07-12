import { useEffect, useState } from "react";
import { RealWebLlmStatusBadge } from "./RealWebLlmStatusBadge";
import { RealWebLlmModelSelector } from "./RealWebLlmModelSelector";
import { RealWebLlmLoadProgressPanel } from "./RealWebLlmLoadProgressPanel";
import { RealWebLlmChatTestPanel } from "./RealWebLlmChatTestPanel";
import { RealWebLlmSafetyNote } from "./RealWebLlmSafetyNote";
import {
  detectRealWebLlmAvailability,
  setRealWebLlmRuntimePartial,
  resetRealWebLlmEngine,
} from "@/lib/real-webllm/aetherRealWebLlmRuntime";

export function RealWebLlmPanel() {
  const [env, setEnv] = useState<{ message: string; fallback: boolean } | null>(null);

  const detect = async () => {
    const r = await detectRealWebLlmAvailability();
    setEnv({ message: r.message, fallback: r.fallback });
    setRealWebLlmRuntimePartial({
      webGpuSupported: r.webGpuSupported,
      webLlmPackageAvailable: r.webLlmPackageAvailable,
      engineStatus: r.fallback ? "UNSUPPORTED" : "NOT_READY",
      fallbackReason: r.fallback ? r.message : undefined,
    });
  };

  useEffect(() => { detect(); }, []);

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <RealWebLlmStatusBadge />
          <span className="text-[11px] text-muted-foreground">{env?.message ?? "正在检测环境……"}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={detect} className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-muted/40">检测环境</button>
          <button onClick={resetRealWebLlmEngine} className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-muted/40">重置</button>
        </div>
      </section>

      <RealWebLlmSafetyNote />

      <section className="space-y-2">
        <h2 className="text-sm">选择模型</h2>
        <RealWebLlmModelSelector />
      </section>

      <RealWebLlmLoadProgressPanel />

      <section className="space-y-2">
        <h2 className="text-sm">本地测试</h2>
        <RealWebLlmChatTestPanel />
      </section>
    </div>
  );
}
