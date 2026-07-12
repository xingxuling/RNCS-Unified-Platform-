import { createFileRoute } from "@tanstack/react-router";
import { FounderGate } from "@/components/FounderGate";
import { CodeGenerationPanel } from "@/components/CodeGenerationPanel";

export const Route = createFileRoute("/code-generator")({
  head: () => ({
    meta: [
      { title: "代码生成计算法 · Code Generator" },
      { name: "description", content: "根据模块与百科生成代码任务与提示词（仅创始人可用）。" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CodeGeneratorRoute,
});

function CodeGeneratorRoute() {
  return (
    <FounderGate>
      <div className="container mx-auto px-4 py-8 space-y-4">
        <header className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Generation OS</div>
          <h1 className="font-display text-2xl gold-text">代码生成计算法</h1>
          <p className="text-sm text-muted-foreground">
            Code Generation Calculus · 自动规划文件、验收清单与 Lovable / Codex / Cursor 提示词。
          </p>
        </header>
        <CodeGenerationPanel />
      </div>
    </FounderGate>
  );
}
