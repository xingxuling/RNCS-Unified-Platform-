import { createFileRoute } from "@tanstack/react-router";
import { UsageExamplePanel } from "@/components/UsageExamplePanel";

export const Route = createFileRoute("/usage-examples")({
  head: () => ({
    meta: [
      { title: "使用示例 · Usage Examples — Aether Fate Engine" },
      { name: "description", content: "使用示例计算法：根据你的身份与场景，自动匹配输入模板、输出样例与下一步动作。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <UsageExamplePanel />
    </div>
  ),
});
