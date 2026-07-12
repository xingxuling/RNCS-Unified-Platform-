import { createFileRoute } from "@tanstack/react-router";
import { PastLifeRecallPanel } from "@/components/PastLifeRecallPanel";

export const Route = createFileRoute("/past-life-recall")({
  head: () => ({
    meta: [
      { title: "前世感记忆 · Past-Life Recall" },
      { name: "description", content: "把前世感、梦境、既视感、原型经验作为可记录、可分析、可回验的深层材料。" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <PastLifeRecallPanel variant="founder" />
    </div>
  ),
});
