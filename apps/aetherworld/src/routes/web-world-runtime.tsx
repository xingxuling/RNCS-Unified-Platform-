import { createFileRoute } from "@tanstack/react-router";
import { WebWorldRuntimePanel } from "@/components/web-world-runtime/WebWorldRuntimePanel";

export const Route = createFileRoute("/web-world-runtime")({
  head: () => ({
    meta: [
      { title: "世界运行时 · WebWorldRuntimeM" },
      { name: "description", content: "对 sequence-world 引擎的统一 WebXXM 封装：对话 / 商店 / 工作区 / 社交均可调用。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <WebWorldRuntimePanel />
    </div>
  ),
});
