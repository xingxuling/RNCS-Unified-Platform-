import { createFileRoute } from "@tanstack/react-router";
import { WebLlmRuntimePanel } from "@/components/webllm/WebLlmRuntimePanel";

export const Route = createFileRoute("/webllm-test")({
  head: () => ({
    meta: [
      { title: "WebLLM Test · WebLLM 测试" },
      { name: "description", content: "测试 WebLLM 在浏览器内运行的能力、提示构建、神经启发控制层和 QA。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">WebLLM Test</h1>
      <p className="text-sm text-muted-foreground">用控制台快速测试 WebLLM 本地运行、提示编译与神经启发控制。</p>
      <WebLlmRuntimePanel />
    </div>
  ),
});
