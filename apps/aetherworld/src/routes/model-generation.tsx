import { createFileRoute } from "@tanstack/react-router";
import { ModelGenerationPanel } from "@/components/model-generation/ModelGenerationPanel";

export const Route = createFileRoute("/model-generation")({
  head: () => ({
    meta: [
      { title: "模型生成 · Model Generation Engine" },
      { name: "description", content: "把任意对象抽象成可保存、可调用、可回验、可导出的结构模型。" },
    ],
  }),
  component: ModelGenerationPage,
});

function ModelGenerationPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">模型生成引擎</h1>
        <p className="text-sm text-muted-foreground">
          输入任意对象 / 产品 / 角色 / 事件，自动生成结构模型、字段、权重、回验计划与多目标导出。
        </p>
      </header>
      <ModelGenerationPanel />
    </div>
  );
}
