import { createFileRoute } from "@tanstack/react-router";
import { HubPage } from "@/components/minimal/HubPage";

export const Route = createFileRoute("/worlds")({
  head: () => ({ meta: [{ title: "世界 · Aetherworld" }] }),
  component: () => (
    <HubPage
      caption="Worlds"
      title="世界"
      subtitle="WebLWM 世界引擎、世界对象、地图、文明与时间线。"
      groups={[
        { id: "engine", label: "引擎", items: [
          { to: "/world-runtime",   label: "世界运行时" },
          { to: "/world-engine",    label: "世界引擎" },
          { to: "/world-simulation",label: "世界模拟" },
          { to: "/sequence-world",  label: "数列世界" },
        ]},
        { id: "registry", label: "世界库", items: [
          { to: "/world-registry",  label: "世界注册表" },
          { to: "/world-snapshots", label: "世界快照" },
          { to: "/multi-world-network", label: "多世界网络" },
          { to: "/cross-world-relations", label: "跨世界关系" },
        ]},
        { id: "content", label: "世界内容", items: [
          { to: "/world-map",      label: "地图" },
          { to: "/world-character",label: "角色" },
          { to: "/world-npcs",     label: "NPC" },
          { to: "/world-quests",   label: "任务" },
          { to: "/world-factions", label: "势力" },
          { to: "/world-economy",  label: "经济" },
          { to: "/world-timelines",label: "时间线" },
        ]},
      ]}
    />
  ),
});
