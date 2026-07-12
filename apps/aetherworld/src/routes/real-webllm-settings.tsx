import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import {
  listRealWebLlmRuns,
  clearRealWebLlmRuns,
  resetRealWebLlmEngine,
  getRealWebLlmRuntimeState,
  subscribeRealWebLlmRuntime,
} from "@/lib/real-webllm/aetherRealWebLlmRuntime";

export const Route = createFileRoute("/real-webllm-settings")({
  head: () => ({ meta: [{ title: "真实语言模型设置" }] }),
  component: Page,
});

function Page() {
  const s = useSyncExternalStore(subscribeRealWebLlmRuntime, getRealWebLlmRuntimeState, getRealWebLlmRuntimeState);
  const runs = listRealWebLlmRuns().slice(0, 30);
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-display">真实语言模型设置</h1>
          <p className="text-sm text-muted-foreground">查看运行状态、历史记录与缓存说明。</p>
        </header>

        <section className="aether-card p-4 text-xs space-y-1.5">
          <Row k="当前模型" v={s.selectedModelId ?? "未选择"} />
          <Row k="引擎状态" v={s.engineStatus} />
          <Row k="WebGPU 支持" v={s.webGpuSupported ? "是" : "否"} />
          <Row k="依赖可用" v={s.webLlmPackageAvailable ? "是" : "否"} />
          {s.lastError && <Row k="最近错误" v={s.lastError} />}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm">运行历史</h2>
            <div className="flex gap-2">
              <button onClick={() => clearRealWebLlmRuns()} className="text-xs px-2.5 py-1 rounded-md border border-border/60 hover:bg-muted/40">清空记录</button>
              <button onClick={() => resetRealWebLlmEngine()} className="text-xs px-2.5 py-1 rounded-md border border-border/60 hover:bg-muted/40">重置引擎</button>
            </div>
          </div>
          <div className="aether-card divide-y divide-border/40">
            {runs.length === 0 && <div className="p-4 text-xs text-muted-foreground">暂无运行记录。</div>}
            {runs.map((r) => (
              <div key={r.recordId} className="px-3 py-2 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground">{r.taskType} · {r.sourceModule}</span>
                  <span className="text-muted-foreground">{r.status} · QA {r.qaStatus}</span>
                </div>
                <div className="text-muted-foreground mt-0.5 truncate">{r.textPreview || "（无文本）"}</div>
                <div className="text-muted-foreground/70 mt-0.5">{r.modelId} · {new Date(r.createdAt).toLocaleString("zh-CN")}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="text-[11px] text-muted-foreground leading-relaxed">
          模型权重由 @mlc-ai/web-llm 在首次加载时下载并缓存在浏览器（IndexedDB / Cache Storage）中。清除浏览器缓存会导致下次需要重新下载。
        </section>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground truncate max-w-[60%]">{v}</span>
    </div>
  );
}
