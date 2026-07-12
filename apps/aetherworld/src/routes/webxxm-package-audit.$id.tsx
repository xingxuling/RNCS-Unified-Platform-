import { createFileRoute, useParams } from "@tanstack/react-router";
import { WebXXMPackageAuditPanel } from "@/components/webxxm-store/WebXXMPackageAuditPanel";

export const Route = createFileRoute("/webxxm-package-audit/$id")({
  head: () => ({ meta: [{ title: "能力包审计 · WebXXM" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { id } = useParams({ from: "/webxxm-package-audit/$id" });
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <header>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Audit</div>
          <h1 className="text-2xl font-display">能力包审计</h1>
        </header>
        <WebXXMPackageAuditPanel packageId={id} />
      </div>
    </div>
  );
}
