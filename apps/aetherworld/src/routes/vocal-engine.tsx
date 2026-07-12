import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { VocalEnginePanel } from "@/components/vocal/VocalEnginePanel";

export const Route = createFileRoute("/vocal-engine")({
  head: () => ({
    meta: [
      { title: "声乐引擎 · Aether Vocal Engine — Aether Fate Engine" },
      { name: "description", content: "声乐引擎：根据角色、歌曲意图、语言、音域与情绪曲线，生成声线设计、唱法映射、AI 音乐提示词与练唱建议。" },
    ],
  }),
  component: () => (
    <>
      <PageHeader
        caption="Aether Vocal Engine · 声乐引擎"
        title="声乐引擎"
        subtitle="角色声线 · 歌词演唱分析 · AI 音乐提示词 · 多语言演唱适配 · 练唱计划。"
      />
      <div className="p-6 md:p-10">
        <VocalEnginePanel />
      </div>
    </>
  ),
});
