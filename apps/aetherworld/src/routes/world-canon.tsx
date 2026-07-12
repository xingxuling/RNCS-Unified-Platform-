import { createFileRoute } from "@tanstack/react-router";
import { WorldCanonPanel } from "@/components/sequence-world/growth/WorldCanonPanel";

export const Route = createFileRoute("/world-canon")({
  head: () => ({
    meta: [
      { title: "World Canon · 世界正典" },
      { name: "description", content: "世界正典知识库：DRAFT / SOFT_CANON / HARD_CANON / FOUNDER_LOCKED。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <WorldCanonPanel />
    </div>
  ),
});
