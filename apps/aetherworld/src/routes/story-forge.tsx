import { createFileRoute } from "@tanstack/react-router";
import { NarrativeEnginePanel } from "@/components/narrative/NarrativeEnginePanel";

export const Route = createFileRoute("/story-forge")({
  head: () => ({ meta: [{ title: "Story Forge · 剧情锻造炉" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Aether Narrative Engine</h1>
        <p className="text-sm text-muted-foreground">Founder · 剧情锻造炉。</p>
      </header>
      <NarrativeEnginePanel />
    </div>
  ),
});
