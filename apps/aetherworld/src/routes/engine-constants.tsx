import { createFileRoute } from "@tanstack/react-router";
import { EngineWeightPanel } from "@/components/constants-universe/EngineWeightPanel";
import { ConstantSafetyNote } from "@/components/constants-universe/ConstantSafetyNote";

export const Route = createFileRoute("/engine-constants")({
  head: () => ({ meta: [{ title: "引擎常数 · Engine Constants v0.2" }, { name: "description", content: "Sequence AI / Omni 路由的默认引擎权重。" }] }),
  component: () => (
    <div className="container mx-auto px-4 py-6 space-y-4 max-w-7xl">
      <header>
        <h1 className="text-2xl font-semibold">引擎常数 · Engine Constants</h1>
        <p className="text-sm text-muted-foreground">不同意图下的默认引擎权重。</p>
      </header>
      <ConstantSafetyNote />
      <EngineWeightPanel />
    </div>
  ),
});
