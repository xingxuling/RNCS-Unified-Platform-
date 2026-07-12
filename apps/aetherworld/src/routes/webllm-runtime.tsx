import { createFileRoute } from "@tanstack/react-router";
import { WebLlmRuntimePanel } from "@/components/webllm/WebLlmRuntimePanel";

export const Route = createFileRoute("/webllm-runtime")({
  head: () => ({
    meta: [
      { title: "WebLLM Runtime · 以太 WebLLM 神经启发运行时" },
      { name: "description", content: "在支持 WebGPU 的浏览器中运行轻量本地 LLM，为数列 AI、数字角色、App Runtime、Code Sandbox 提供本地语言补全。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Aether WebLLM Neuro-Inspired Runtime v0.3</h1>
        <p className="text-sm text-muted-foreground">
          在浏览器内使用 WebLLM / WebGPU 运行轻量 LLM，让数列 AI、数字角色、App Runtime、Code Sandbox、声乐、剧情和文档生成获得本地语言补全能力。系统保持本地优先、规则优先、可降级、可审计。
        </p>
      </header>
      <WebLlmRuntimePanel />
    </div>
  ),
});
