import { createFileRoute } from "@tanstack/react-router";
import { listWebLlmModels } from "@/lib/webllm/webLlmModelRegistry";

export const Route = createFileRoute("/webllm-models")({
  head: () => ({
    meta: [
      { title: "WebLLM Models · WebLLM 模型" },
      { name: "description", content: "Aetherworld 本地 WebLLM 模型注册表，包含聊天、代码、创作、通用与自定义模型。" },
    ],
  }),
  component: ModelsPage,
});

function ModelsPage() {
  const models = listWebLlmModels();
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLLM Models · 模型注册表</h1>
        <p className="text-sm text-muted-foreground">本地浏览器轻量 LLM 模型。首次加载需要下载并缓存。</p>
      </header>
      <div className="space-y-2">
        {models.map((m) => (
          <div key={m.modelId} className="border border-border/40 rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-medium">{m.displayName}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{m.modelId} · {m.modelFamily}</div>
              </div>
              <div className="text-[11px] text-muted-foreground">{m.estimatedSize} · {m.recommendedDevice}</div>
            </div>
            <div className="text-[12px] mt-2 text-muted-foreground">用途：{m.recommendedUse.join(" / ")}</div>
            <div className="text-[11px] mt-1 text-muted-foreground/80">{m.notes.join(" · ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
