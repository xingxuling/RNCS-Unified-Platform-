import { createFileRoute } from "@tanstack/react-router";
import { DocsAuditPanel } from "@/components/learning/DocsAuditPanel";
import { DocsSafetyNote } from "@/components/learning/DocsSafetyNote";

export const Route = createFileRoute("/docs-audit")({
  head: () => ({ meta: [{ title: "文档审计 · Docs Audit" }, { name: "description", content: "Aetherworld 文档审计。" }] }),
  component: DocsAuditPage,
});

function DocsAuditPage() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <header><h1 className="text-2xl font-semibold">文档审计 · Docs Audit</h1></header>
      <DocsAuditPanel />
      <DocsSafetyNote />
    </div>
  );
}
