import { createFileRoute } from "@tanstack/react-router";
import { SubRouteAuditPanel } from "@/components/router/SubRouteAuditPanel";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";

export const Route = createFileRoute("/subroute-audit")({
  head: () => ({
    meta: [
      { title: "子路由审计 — Sub-Route Audit" },
      { name: "description", content: "检查侧边栏与子路由系统的健康度、重复、孤儿路由与权限暴露。" },
    ],
  }),
  component: SubRouteAuditPage,
});

function SubRouteAuditPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">子路由审计</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sub-Route Audit · 检查 Collapsible Sub-Router System 中所有子路由的注册完整性、权限一致性和命名规范。
        </p>
      </header>
      <SubRouteAuditPanel />
    </div>
  );
}
