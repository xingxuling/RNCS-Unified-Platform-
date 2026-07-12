import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { ReleaseNotePreview } from "@/components/version-leap/ReleaseNotePreview";
import { VersionExportPanel } from "@/components/version-leap/VersionExportPanel";
import { VersionSafetyNote } from "@/components/version-leap/VersionSafetyNote";
import { buildVersionLeapBundle } from "@/lib/version-leap/versionLeapEngine";

export const Route = createFileRoute("/release-notes")({
  head: () => ({
    meta: [
      { title: "更新日志 — Release Notes" },
      { name: "description", content: "Aetherworld 的 Public 与 Founder 版更新日志。" },
    ],
  }),
  component: Page,
});

function Page() {
  const b = buildVersionLeapBundle("public");
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">更新日志</h1>
        <p className="text-sm text-muted-foreground mt-1">Release Notes · 自动生成 Public 与 Founder 双版本。</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReleaseNotePreview note={b.publicNote} label="Public Release Note" />
        <ReleaseNotePreview note={b.founderNote} label="Founder Release Note" />
      </div>
      <VersionExportPanel note={b.publicNote} />
      <VersionSafetyNote />
    </div>
  );
}
