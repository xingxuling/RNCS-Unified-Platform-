import { createFileRoute } from "@tanstack/react-router";
import { NarrativeEnginePanel } from "@/components/narrative/NarrativeEnginePanel";

export const Route = createFileRoute("/narrative-engine")({
  head: () => ({ meta: [{ title: "剧情文本引擎 · Narrative Engine" }, { name: "description", content: "把结构模型转化为可控、可审计、可迭代的剧情文本。" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">剧情文本引擎</h1>
        <p className="text-sm text-muted-foreground">小说 / 网文 / 漫画 / 游戏任务 / 视觉小说 / 独白 / 世界观 / 虚拟生活日记 / 歌曲剧情。</p>
      </header>
      <NarrativeEnginePanel />
    </div>
  ),
});
