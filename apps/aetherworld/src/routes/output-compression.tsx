import { createFileRoute } from "@tanstack/react-router";
import { HybridCompressionPanel } from "@/components/compression/HybridCompressionPanel";

export const Route = createFileRoute("/output-compression")({
  head: () => ({
    meta: [
      { title: "输出压缩 · Output Compression" },
      { name: "description", content: "把任意引擎的原始输出压缩为普通用户 / 结构用户 / 创作者 / 开发者 / 创始人可用的版本。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">输出压缩 · Output Compression</h1>
        <p className="text-sm text-muted-foreground">选择受众与压缩等级，把复杂输出变成你能用得上的形态。</p>
      </header>
      <HybridCompressionPanel />
    </div>
  ),
});
