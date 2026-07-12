import { createFileRoute } from "@tanstack/react-router";
import { AetherCanvasWorkspace } from "@/components/command-canvas/AetherCanvasWorkspace";

export const Route = createFileRoute("/canvas-workspace")({
  head: () => ({ meta: [{ title: "Canvas Workspace · 画布工作区" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-3">
      <header>
        <h1 className="text-xl font-semibold">画布工作区 · Canvas Workspace</h1>
        <p className="text-sm text-muted-foreground">对象编辑、代码预览、世界状态、概念图、运行结果统一渲染区。</p>
      </header>
      <AetherCanvasWorkspace />
    </div>
  ),
});
