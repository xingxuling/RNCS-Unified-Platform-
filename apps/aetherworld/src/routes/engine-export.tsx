import { createFileRoute } from "@tanstack/react-router";
import { SequenceWorldPanel } from "@/components/sequence-world/SequenceWorldPanel";

export const Route = createFileRoute("/engine-export")({
  head: () => ({
    meta: [
      { title: "Engine Export · 引擎导出" },
      { name: "description", content: "导出 Sequence World Profile 为 Unity / Godot / JSON / C# / GDScript / Markdown / Prompt 多种目标。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <SequenceWorldPanel />
    </div>
  ),
});
