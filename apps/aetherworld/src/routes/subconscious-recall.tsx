import { createFileRoute } from "@tanstack/react-router";
import { PastLifeRecallPanel } from "@/components/PastLifeRecallPanel";

export const Route = createFileRoute("/subconscious-recall")({
  head: () => ({
    meta: [
      { title: "深层记忆记录 · Subconscious Recall" },
      { name: "description", content: "记录梦境、既视感、反复出现的画面与符号，作为自我观察与创作素材。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <PastLifeRecallPanel variant="beginner" />
    </div>
  ),
});
