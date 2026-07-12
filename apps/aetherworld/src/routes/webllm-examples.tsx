import { createFileRoute } from "@tanstack/react-router";
import { WEB_LLM_EXAMPLES } from "@/lib/webllm/webLlmExamplesRegistry";

export const Route = createFileRoute("/webllm-examples")({
  head: () => ({
    meta: [
      { title: "WebLLM Examples · WebLLM 示例" },
      { name: "description", content: "WebLLM 本地浏览器 LLM 在 Aetherworld 各引擎中的典型用法示例。" },
    ],
  }),
  component: ExamplesPage,
});

function ExamplesPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLLM Examples</h1>
        <p className="text-sm text-muted-foreground">从可用性检测到剧情草案，覆盖 Aetherworld 的典型 WebLLM 用法。</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {WEB_LLM_EXAMPLES.map((e) => (
          <div key={e.id} className="border border-border/40 rounded p-3 space-y-1">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{e.id} · {e.taskType}</div>
            <div className="text-base font-medium">{e.title}</div>
            <div className="text-[12px] text-muted-foreground">{e.prompt}</div>
            <div className="text-[11px] text-muted-foreground/80">接入：{e.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
