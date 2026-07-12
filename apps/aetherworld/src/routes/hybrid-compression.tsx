import { createFileRoute } from "@tanstack/react-router";
import { HybridCompressionPanel } from "@/components/compression/HybridCompressionPanel";

export const Route = createFileRoute("/hybrid-compression")({
  head: () => ({
    meta: [
      { title: "黑白箱混合压缩 · Hybrid Compression" },
      { name: "description", content: "将系统内部黑箱判断与白箱结构压缩成可读、可行动、可回验、分层展示的输出。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">黑白箱混合压缩 · Hybrid Compression Engine</h1>
        <p className="text-sm text-muted-foreground">
          在系统的复杂计算与用户的可用答案之间建立压缩层。黑箱信号被表达为判断摘要，白箱结构保留依据与边界，输出按受众分层展示。
        </p>
      </header>
      <HybridCompressionPanel />
    </div>
  ),
});
