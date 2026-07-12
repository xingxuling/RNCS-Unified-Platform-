import { createFileRoute } from "@tanstack/react-router";
import { AetherCapabilityDock } from "@/components/command-canvas/AetherCapabilityDock";

export const Route = createFileRoute("/capability-dock")({
  head: () => ({ meta: [{ title: "Capability Dock · 能力坞" }] }),
  component: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-3">
      <header>
        <h1 className="text-xl font-semibold">能力坞 · Capability Dock</h1>
        <p className="text-sm text-muted-foreground">一站式调用 WebLKM/WebCM/WebCoM/WebLCM/WebLLM/WebLWM 与 WebXX 能力模型群。</p>
      </header>
      <AetherCapabilityDock />
    </div>
  ),
});
