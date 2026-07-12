import { createFileRoute } from "@tanstack/react-router";
import { SystemAuditTable } from "@/components/audit/SystemAuditTable";

export const Route = createFileRoute("/system-audit")({
  head: () => ({
    meta: [
      { title: "系统总验收 · System Integration Audit" },
      { name: "description", content: "Aether 全系统一致性验收：连通性、入口、数据流、QA、Recalculation、隔离与安全边界。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <SystemAuditTable />
    </div>
  ),
});
