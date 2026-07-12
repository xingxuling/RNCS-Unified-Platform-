import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { VersionTimelinePanel } from "@/components/version-leap/VersionTimelinePanel";
import { VersionSafetyNote } from "@/components/version-leap/VersionSafetyNote";

export const Route = createFileRoute("/version-timeline")({
  head: () => ({
    meta: [
      { title: "版本时间线 — Version Timeline" },
      { name: "description", content: "Aetherworld 历史版本与里程碑。" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">版本时间线</h1>
        <p className="text-sm text-muted-foreground mt-1">Version Timeline · 历史版本、里程碑与发布状态。</p>
      </header>
      <VersionTimelinePanel />
      <VersionSafetyNote />
    </div>
  );
}
