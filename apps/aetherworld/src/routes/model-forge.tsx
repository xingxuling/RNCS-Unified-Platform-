import { createFileRoute } from "@tanstack/react-router";
import { ModelGenerationPanel } from "@/components/model-generation/ModelGenerationPanel";

export const Route = createFileRoute("/model-forge")({
  head: () => ({
    meta: [
      { title: "Aether Model Forge · 模型锻造炉" },
      { name: "description", content: "Founder 工作台：把对象抽象为可导出的结构模型。" },
    ],
  }),
  component: ModelForgePage,
});

function ModelForgePage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Aether Model Forge</h1>
        <p className="text-sm text-muted-foreground">模型锻造炉 · 高阶 / Founder 完整参数。</p>
      </header>
      <ModelGenerationPanel />
    </div>
  );
}
