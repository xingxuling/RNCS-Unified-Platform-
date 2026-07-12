import { createFileRoute } from "@tanstack/react-router";
import { UniversalBreakthroughPanel } from "@/components/UniversalBreakthroughPanel";

export const Route = createFileRoute("/universal-breakthrough")({
  head: () => ({
    meta: [
      { title: "万物破解计算法 · Universal Breakthrough" },
      { name: "description", content: "把任意现实对象拆成可推演、可行动、可回验的结构化破解路径。" },
    ],
  }),
  component: UniversalBreakthroughRoute,
});

function UniversalBreakthroughRoute() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Universal Breakthrough Calculus</div>
        <h1 className="font-display text-2xl gold-text">万物破解 · 现实结构化拆解</h1>
        <p className="text-sm text-muted-foreground">
          万物破解计算法是一种问题破解元算法：识别对象 → 五域映射 → 常数缺口 → 阻力削减 → 行动许可 → 解法路径 → 验证路径 → 递归再破解。
        </p>
      </header>
      <UniversalBreakthroughPanel />
    </div>
  );
}
