import { createFileRoute } from "@tanstack/react-router";
import { LovableIntegrationsPanel } from "@/components/lovable-native/LovableIntegrationsPanel";

export const Route = createFileRoute("/integrations/lovable")({
  head: () => ({
    meta: [
      { title: "Lovable 原生能力 · Aetherworld" },
      { name: "description", content: "在 Aetherworld 中集中管理 Lovable Cloud、Lovable AI、构建链接、GitHub 同步、连接器、SEO 检查等原生能力。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <LovableIntegrationsPanel />
    </div>
  ),
});
