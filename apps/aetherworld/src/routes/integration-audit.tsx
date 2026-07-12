import { createFileRoute } from "@tanstack/react-router";
import { SystemAuditTable } from "@/components/audit/SystemAuditTable";

export const Route = createFileRoute("/integration-audit")({
  head: () => ({
    meta: [
      { title: "总集成审计 · Integration Audit" },
      { name: "description", content: "Aether 总集成审计：覆盖 MSL、Omni、Sequence World、Virtual Life、Encyclopedia、Prompt Forge、QA、Recalculation。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <SystemAuditTable />
    </div>
  ),
});
