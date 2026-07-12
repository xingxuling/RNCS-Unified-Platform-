import { createFileRoute } from "@tanstack/react-router";
import { WorldBranchTimelinePanel } from "@/components/sequence-world/growth/WorldBranchTimelinePanel";

export const Route = createFileRoute("/world-timelines")({
  head: () => ({
    meta: [
      { title: "World Timelines · 世界时间线" },
      { name: "description", content: "支持世界分支、时间线比较、归档与导出。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <WorldBranchTimelinePanel />
    </div>
  ),
});
