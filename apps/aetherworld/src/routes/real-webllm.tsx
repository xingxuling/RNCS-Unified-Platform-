import { createFileRoute, Link } from "@tanstack/react-router";
import { RealWebLlmPanel } from "@/components/real-webllm/RealWebLlmPanel";

export const Route = createFileRoute("/real-webllm")({
  head: () => ({ meta: [{ title: "真实语言模型 · Aether Real WebLLM" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Aether Real WebLLM</div>
          <h1 className="text-2xl font-display">真实语言模型</h1>
          <p className="text-sm text-muted-foreground">
            通过 @mlc-ai/web-llm 在浏览器本地用 WebGPU 加载并运行真实模型。不依赖 OpenAI / Claude / Gemini。
          </p>
          <div className="text-[11px] flex gap-3">
            <Link to="/real-webllm-test" className="text-muted-foreground hover:text-foreground">→ 测试对话</Link>
            <Link to="/real-webllm-settings" className="text-muted-foreground hover:text-foreground">→ 设置与记录</Link>
          </div>
        </header>
        <RealWebLlmPanel />
      </div>
    </div>
  );
}
