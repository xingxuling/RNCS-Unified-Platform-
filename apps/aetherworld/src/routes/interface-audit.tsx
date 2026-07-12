import { createFileRoute } from "@tanstack/react-router";
import { UIAuditPanel } from "@/components/ui-update/UIAuditPanel";
import { SubRouteAuditPanel } from "@/components/router/SubRouteAuditPanel";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";

export const Route = createFileRoute("/interface-audit")({
  head: () => ({
    meta: [
      { title: "界面审计 — Interface Audit" },
      { name: "description", content: "检查 UI 模块覆盖度、空状态、权限暴露与子路由健康。" },
    ],
  }),
  component: InterfaceAuditPage,
});

function InterfaceAuditPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">界面审计</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interface Audit · 综合 UI Update Engine 审计 + Collapsible Sub-Router 审计。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">UI 模块审计</h2>
        <UIAuditPanel />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">子路由审计</h2>
        <SubRouteAuditPanel />
      </section>
    </div>
  );
}
