import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { VocalEnginePanel } from "@/components/vocal/VocalEnginePanel";

export const Route = createFileRoute("/ai-music-prompt")({
  head: () => ({
    meta: [
      { title: "AI 音乐提示词 · AI Music Prompt — Aether Fate Engine" },
      { name: "description", content: "为 Suno / Udio / Google AI Studio 生成可用的歌曲提示词、声线描述与负向词。" },
    ],
  }),
  component: () => (
    <>
      <PageHeader caption="AI Music Prompt · AI 音乐提示词" title="AI 音乐提示词" subtitle="Suno / Udio / Google AI Studio 可用 prompt 生成。" />
      <div className="p-6 md:p-10"><VocalEnginePanel defaultMode="AI_MUSIC_PROMPT" /></div>
    </>
  ),
});
