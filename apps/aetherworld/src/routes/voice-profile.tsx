import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { VocalEnginePanel } from "@/components/vocal/VocalEnginePanel";

export const Route = createFileRoute("/voice-profile")({
  head: () => ({
    meta: [
      { title: "声线画像 · Voice Profile — Aether Fate Engine" },
      { name: "description", content: "声线画像：基于主体或角色生成声线参数、音域建议与风险提示。" },
    ],
  }),
  component: () => (
    <>
      <PageHeader caption="Voice Profile · 声线画像" title="声线画像" subtitle="基于主体/角色构建声线参数与音域建议。" />
      <div className="p-6 md:p-10"><VocalEnginePanel defaultMode="CHARACTER_VOICE" /></div>
    </>
  ),
});
