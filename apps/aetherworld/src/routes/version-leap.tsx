import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { VersionLeapPanel } from "@/components/version-leap/VersionLeapPanel";
import { VersionSafetyNote } from "@/components/version-leap/VersionSafetyNote";

export const Route = createFileRoute("/version-leap")({
  head: () => ({
    meta: [
      { title: "版本跃迁 — Application Version Leap Engine" },
      { name: "description", content: "检测、评分、归类、生成 Aetherworld 的版本跃迁与发布建议。" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">应用版本跃迁检测引擎</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Application Version Leap Detection Engine · 判断变更属于 patch / minor / major / leap / generation。
        </p>
      </header>
      <VersionLeapPanel />
      <VersionSafetyNote />
    </div>
  );
}
