import { createFileRoute } from "@tanstack/react-router";
import { HybridCompressionPanel } from "@/components/compression/HybridCompressionPanel";

export const Route = createFileRoute("/compression-audit")({
  head: () => ({
    meta: [
      { title: "压缩审计 · Compression Audit" },
      { name: "description", content: "审计压缩输出：是否丢失关键风险、下一步、回验点；是否泄露 Founder Trace；是否把黑箱写成事实。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">压缩审计 · Compression Audit</h1>
        <p className="text-sm text-muted-foreground">
          运行压缩后自动审计：检查安全说明、下一步、验证点、Founder Trace 隔离、绝对化用词等。
        </p>
      </header>
      <HybridCompressionPanel />
    </div>
  ),
});
