import { createFileRoute, Link } from "@tanstack/react-router";
import { LocalToBackendMigrationPanel } from "@/components/account/LocalToBackendMigrationPanel";
import { StorageModePanel } from "@/components/account/StorageModePanel";

export const Route = createFileRoute("/account/settings")({
  head: () => ({ meta: [{ title: "账户设置 · Aetherworld" }] }),
  component: () => (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <header>
        <Link to="/account" className="text-xs text-muted-foreground">← 返回账户</Link>
        <h1 className="text-xl font-display mt-1">账户设置</h1>
      </header>
      <StorageModePanel />
      <LocalToBackendMigrationPanel />
    </div>
  ),
});
