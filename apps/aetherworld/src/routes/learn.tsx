import { createFileRoute } from "@tanstack/react-router";
import { LearningHomePanel } from "@/components/learning/LearningHomePanel";
import { DocsSearchBox } from "@/components/learning/DocsSearchBox";
import { DocsSafetyNote } from "@/components/learning/DocsSafetyNote";

export const Route = createFileRoute("/learn")({
  head: () => ({ meta: [{ title: "学习中心 · Aetherworld Learning Center" }, { name: "description", content: "Aetherworld 教程与教学文档中心：新手、创作者、开发者、Founder 学习路径与文档。" }] }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold">Aetherworld Learning Center · 学习中心</h1>
        <p className="text-sm text-muted-foreground mt-1">根据当前用户层级、模块、权限自动推荐教程与文档。</p>
      </header>
      <DocsSearchBox />
      <LearningHomePanel />
      <DocsSafetyNote />
    </div>
  );
}
