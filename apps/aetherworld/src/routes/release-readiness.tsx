import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { ReleaseReadinessPanel } from "@/components/version-leap/ReleaseReadinessPanel";
import { VersionSafetyNote } from "@/components/version-leap/VersionSafetyNote";
import { buildVersionLeapBundle } from "@/lib/version-leap/versionLeapEngine";

export const Route = createFileRoute("/release-readiness")({
  head: () => ({
    meta: [
      { title: "发布就绪检查 — Release Readiness" },
      { name: "description", content: "检查 Aetherworld 是否满足发布条件。" },
    ],
  }),
  component: Page,
});

function Page() {
  const b = buildVersionLeapBundle("public");
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">发布就绪检查</h1>
        <p className="text-sm text-muted-foreground mt-1">Release Readiness · QA / UI / Docs / Text / 常数 / 宪法 / 安全综合判断。</p>
      </header>
      <ReleaseReadinessPanel readiness={b.readiness} />
      <VersionSafetyNote />
    </div>
  );
}
