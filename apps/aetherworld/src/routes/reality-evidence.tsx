import { createFileRoute } from "@tanstack/react-router";
import { EvidenceMappingPanel } from "@/components/reality-data/EvidenceMappingPanel";
import { RealityVariablePanel } from "@/components/reality-data/RealityVariablePanel";
import { RealityDataSafetyNote } from "@/components/reality-data/RealityDataSafetyNote";

export const Route = createFileRoute("/reality-evidence")({
  head: () => ({
    meta: [
      { title: "现实证据 · Reality Evidence" },
      { name: "description", content: "查看现实证据映射与现实变量提取结果。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">现实证据</h1>
        <p className="text-sm text-muted-foreground">证据映射、新鲜度与现实变量提取。</p>
      </header>
      <div className="grid md:grid-cols-2 gap-4">
        <EvidenceMappingPanel />
        <RealityVariablePanel />
      </div>
      <RealityDataSafetyNote />
    </div>
  ),
});
