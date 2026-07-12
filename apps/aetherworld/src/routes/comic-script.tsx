import { createFileRoute } from "@tanstack/react-router";
import { NarrativeEnginePanel } from "@/components/narrative/NarrativeEnginePanel";

export const Route = createFileRoute("/comic-script")({
  head: () => ({ meta: [{ title: "漫画脚本 · Comic Script" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header><h1 className="text-2xl font-semibold">漫画脚本</h1>
        <p className="text-sm text-muted-foreground">页 / 格 / 画面 / 对白 / 旁白 / 镜头。</p></header>
      <NarrativeEnginePanel defaultMode="COMIC_SCRIPT" />
    </div>
  ),
});
