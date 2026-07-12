import { createFileRoute } from "@tanstack/react-router";
import { AetherRunsPanel } from "@/components/command-canvas/AetherRunsPanel";

export const Route = createFileRoute("/run-console")({
  head: () => ({ meta: [{ title: "Run Console · 运行控制台" }] }),
  component: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-3">
      <header>
        <h1 className="text-xl font-semibold">运行控制台 · Run Console</h1>
        <p className="text-sm text-muted-foreground">App Runtime、Code Sandbox、WebLLM、WebLCM、WebLKM、QA、Version 等运行记录。</p>
      </header>
      <AetherRunsPanel />
    </div>
  ),
});
