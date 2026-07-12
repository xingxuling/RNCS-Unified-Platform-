import { createFileRoute } from "@tanstack/react-router";
import { CrossFunctionalPanel } from "@/components/cross-functional/CrossFunctionalPanel";

export const Route = createFileRoute("/cross-functional-calculus")({
  head: () => ({
    meta: [
      { title: "功能跨域运用计算法 · Cross-Functional Application Calculus" },
      { name: "description", content: "把一个对象在多个 Aetherworld 引擎之间进行结构迁移、任务转译、输出接力和复用治理。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Cross-Functional Application Calculus · v1.0</div>
        <h1 className="font-display text-2xl gold-text">功能跨域运用计算法</h1>
        <p className="text-sm text-muted-foreground">把一个对象在多个 Aetherworld 引擎之间进行结构迁移、任务转译、输出接力和复用治理。</p>
      </header>
      <CrossFunctionalPanel />
    </div>
  ),
});
