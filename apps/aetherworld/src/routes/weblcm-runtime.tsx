import { createFileRoute } from "@tanstack/react-router";
import { WebLcmRuntimePanel } from "@/components/weblcm/WebLcmRuntimePanel";

export const Route = createFileRoute("/weblcm-runtime")({
  head: () => ({
    meta: [
      { title: "WebLCM Runtime · 以太 WebLCM 概念运行时" },
      { name: "description", content: "在浏览器内把文本、对象、世界、代码、剧情、声乐、计算法和常数压缩为概念对象、概念链和概念图谱，并为 WebLLM 提供更高层语义控制。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Aether WebLCM Runtime v0.4</h1>
        <p className="text-sm text-muted-foreground">
          以太 WebLCM 概念运行时：把输入压缩为概念对象、概念链与概念图谱，再用于概念预测、概念检索、跨域映射与 WebLLM 展开。先概念，后语言。
        </p>
      </header>
      <WebLcmRuntimePanel />
    </div>
  ),
});
