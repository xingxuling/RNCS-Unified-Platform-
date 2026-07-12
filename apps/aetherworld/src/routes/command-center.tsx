import { createFileRoute } from "@tanstack/react-router";
import { AetherCommandCenter } from "@/components/command-canvas/AetherCommandCenter";

export const Route = createFileRoute("/command-center")({
  head: () => ({ meta: [{ title: "Command Center · 指挥中心" }] }),
  component: () => (
    <div className="max-w-3xl mx-auto p-6 space-y-3">
      <header>
        <h1 className="text-xl font-semibold">指挥中心 · Command Center</h1>
        <p className="text-sm text-muted-foreground">输入自然语言任务，系统通过 Sequence AI 自动路由到合适的引擎。</p>
      </header>
      <AetherCommandCenter />
    </div>
  ),
});
