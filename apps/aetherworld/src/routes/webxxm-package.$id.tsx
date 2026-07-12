import { createFileRoute, useParams } from "@tanstack/react-router";
import { WebXXMPackageDetailPanel } from "@/components/webxxm-store/WebXXMPackageDetailPanel";

export const Route = createFileRoute("/webxxm-package/$id")({
  head: () => ({ meta: [{ title: "能力包详情 · WebXXM" }] }),
  component: PackagePage,
});

function PackagePage() {
  const { id } = useParams({ from: "/webxxm-package/$id" });
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <header>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Package</div>
          <h1 className="text-2xl font-display">能力包详情</h1>
        </header>
        <WebXXMPackageDetailPanel packageId={id} />
      </div>
    </div>
  );
}
