import { createFileRoute } from "@tanstack/react-router";
import { WorldAssetRegistryPanel } from "@/components/sequence-world/growth/WorldAssetRegistryPanel";

export const Route = createFileRoute("/world-assets")({
  head: () => ({
    meta: [
      { title: "World Assets · 世界资产" },
      { name: "description", content: "世界资产注册表：区域、NPC、任务、规则、资源、时间线、剧情。仅为虚拟世界结构。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <WorldAssetRegistryPanel />
    </div>
  ),
});
