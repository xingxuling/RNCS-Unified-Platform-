import { createFileRoute, useParams } from "@tanstack/react-router";
import { WebXXMPackageDependencyPanel } from "@/components/webxxm-store/WebXXMPackageDependencyPanel";

export const Route = createFileRoute("/webxxm-package-settings/$id")({
  head: () => ({ meta: [{ title: "能力包设置 · WebXXM" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { id } = useParams({ from: "/webxxm-package-settings/$id" });
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <header>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Settings</div>
          <h1 className="text-2xl font-display">能力包设置</h1>
        </header>
        <WebXXMPackageDependencyPanel packageId={id} />
      </div>
    </div>
  );
}
