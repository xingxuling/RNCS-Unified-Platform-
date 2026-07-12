import { createFileRoute } from "@tanstack/react-router";
import { MissingLayerPanel } from "@/components/missing-layer/MissingLayerPanel";

export const Route = createFileRoute("/missing-layer-calculus")({
  head: () => ({
    meta: [
      { title: "Missing-Layer Detection Calculus · 系统缺层识别计算法" },
      { name: "description", content: "识别 Aetherworld 当前系统缺失的功能层、对象层、工作流层、运行层、治理层、文档层、展示层和商业层，并生成下一步升级建议。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Missing-Layer Detection Calculus · v1.0</div>
        <h1 className="font-display text-2xl gold-text">系统缺层识别计算法</h1>
        <p className="text-sm text-muted-foreground">识别 Aetherworld 当前系统缺层、能力断点、抽象不足、跨域断裂与治理缺口，并生成下一步系统跃迁建议。</p>
      </header>
      <MissingLayerPanel />
    </div>
  ),
});
