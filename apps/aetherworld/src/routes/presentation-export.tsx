import { createFileRoute } from "@tanstack/react-router";
import { WorldPresentationPanel } from "@/components/sequence-world/presentation/WorldPresentationPanel";

export const Route = createFileRoute("/presentation-export")({
  head: () => ({ meta: [
    { title: "表现层导出 · Presentation Export" },
    { name: "description", content: "导出 Godot / Unity / Three.js / 通用 JSON / GDScript / C# 表现层数据包。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl mb-3">表现层导出</h1>
      <p className="text-xs text-muted-foreground mb-4">导出参数仅作表现层用途，不替代 Unity / Godot / Unreal。</p>
      <WorldPresentationPanel />
    </div>
  ),
});
