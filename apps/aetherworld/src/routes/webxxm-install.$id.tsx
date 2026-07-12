import { createFileRoute, useParams } from "@tanstack/react-router";
import { WebXXMInstallPanel } from "@/components/webxxm-store/WebXXMInstallPanel";

export const Route = createFileRoute("/webxxm-install/$id")({
  head: () => ({ meta: [{ title: "安装能力包 · WebXXM" }] }),
  component: InstallPage,
});

function InstallPage() {
  const { id } = useParams({ from: "/webxxm-install/$id" });
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <header>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Install</div>
          <h1 className="text-2xl font-display">安装能力包</h1>
        </header>
        <WebXXMInstallPanel packageId={id} />
      </div>
    </div>
  );
}
