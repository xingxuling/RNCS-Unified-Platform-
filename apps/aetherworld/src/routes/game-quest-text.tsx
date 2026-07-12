import { createFileRoute } from "@tanstack/react-router";
import { NarrativeEnginePanel } from "@/components/narrative/NarrativeEnginePanel";

export const Route = createFileRoute("/game-quest-text")({
  head: () => ({ meta: [{ title: "游戏任务文本 · Game Quest Text" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header><h1 className="text-2xl font-semibold">游戏任务文本</h1>
        <p className="text-sm text-muted-foreground">任务名 / 任务描述 / NPC 对白 / 完成条件。</p></header>
      <NarrativeEnginePanel defaultMode="GAME_QUEST_TEXT" />
    </div>
  ),
});
