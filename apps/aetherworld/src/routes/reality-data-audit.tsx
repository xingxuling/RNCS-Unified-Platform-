import { createFileRoute } from "@tanstack/react-router";
import { RealityDataAuditPanel } from "@/components/reality-data/RealityDataAuditPanel";
import { RealityDataExportPanel } from "@/components/reality-data/RealityDataExportPanel";
import { RealityDataSafetyNote } from "@/components/reality-data/RealityDataSafetyNote";

export const Route = createFileRoute("/reality-data-audit")({
  head: () => ({
    meta: [
      { title: "现实数据审计 · Reality Data Audit" },
      { name: "description", content: "审计外部数据来源、可信度、新鲜度与噪音风险。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">现实数据审计</h1>
        <p className="text-sm text-muted-foreground">检查外部数据是否过期、是否缺少来源、是否被错误地标记为现实证据。</p>
      </header>
      <RealityDataAuditPanel />
      <RealityDataExportPanel />
      <RealityDataSafetyNote />
    </div>
  ),
});
