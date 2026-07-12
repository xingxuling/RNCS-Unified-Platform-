import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { VersionAuditPanel } from "@/components/version-leap/VersionAuditPanel";
import { VersionSafetyNote } from "@/components/version-leap/VersionSafetyNote";
import { buildVersionLeapBundle } from "@/lib/version-leap/versionLeapEngine";

export const Route = createFileRoute("/version-audit")({
  head: () => ({
    meta: [
      { title: "版本审计 — Version Audit" },
      { name: "description", content: "检查 Aetherworld 版本治理是否完整。" },
    ],
  }),
  component: Page,
});

function Page() {
  const b = buildVersionLeapBundle("internal");
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">版本审计</h1>
        <p className="text-sm text-muted-foreground mt-1">Version Audit · 检查版本号、发布说明、跃迁评分、审批等。</p>
      </header>
      <VersionAuditPanel audit={b.audit} />
      <VersionSafetyNote />
    </div>
  );
}
