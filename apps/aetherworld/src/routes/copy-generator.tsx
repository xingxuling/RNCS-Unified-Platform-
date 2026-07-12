import { createFileRoute } from "@tanstack/react-router";
import { CopywritingGenerationPanel } from "@/components/CopywritingGenerationPanel";

export const Route = createFileRoute("/copy-generator")({
  head: () => ({
    meta: [
      { title: "文案生成计算法 · Copy Generator" },
      { name: "description", content: "根据目标用户与渠道生成多版本文案，内置安全守护。" },
    ],
  }),
  component: CopyGeneratorRoute,
});

function CopyGeneratorRoute() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Generation OS</div>
        <h1 className="font-display text-2xl gold-text">文案生成计算法</h1>
        <p className="text-sm text-muted-foreground">
          Copywriting Generation Calculus · 面向官网、入门、世界报告、小红书、企业等渠道生成 3 个版本。
        </p>
      </header>
      <CopywritingGenerationPanel />
    </div>
  );
}
